const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const crypto = require('crypto');
const router = express.Router();

const DELETED_RESTAURANT_MESSAGE = 'Tu restaurante ha sido eliminado. Contacta al Superadmin si crees que se trata de un error.';

function emailHash(email) {
  return crypto.createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');
}

async function isDeletedRestaurantEmail(email) {
  if (!email) return false;
  const { data, error } = await supabaseAdmin
    .from('restaurante_eliminado_acceso')
    .select('email_hash')
    .eq('email_hash', emailHash(email))
    .maybeSingle();

  if (error) {
    console.warn('[Auth Login] No se pudo validar marcador de restaurante eliminado:', error.message);
    return false;
  }
  return Boolean(data);
}

async function getActiveUserByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .select('id, rol, auth_id, activo')
    .eq('email', String(email).trim().toLowerCase())
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.warn('[Auth Login] No se pudo validar usuario por email:', error.message);
    return null;
  }
  return data || null;
}

/**
 * POST /api/auth/login
 * Autenticación real con email y contraseña via Supabase Auth
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email y contraseña son requeridos.' });
    }

    // 1. Autenticar con Supabase Auth
    console.log(`[Auth Login] Intentando login para: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      console.error('[Auth Login] Supabase error:', authError.message, 'Code:', authError.status);
      const profileByEmail = await getActiveUserByEmail(email);
      if (profileByEmail?.rol === 'admin_saas') {
        return res.status(401).json({ error: true, message: 'No se pudo autenticar la cuenta Superadmin. Verifica la contraseña o restaura su usuario en Supabase Auth.' });
      }
      if (await isDeletedRestaurantEmail(email)) {
        return res.status(410).json({ error: true, code: 'RESTAURANTE_ELIMINADO', message: DELETED_RESTAURANT_MESSAGE });
      }
      return res.status(401).json({ error: true, message: 'Email o contraseña incorrectos.' });
    }

    // 2. Buscar el usuario en nuestra tabla vinculado por auth_id
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .select('*, restaurante(*)')
      .eq('auth_id', authData.user.id)
      .eq('activo', true)
      .single();

    if (userError || !usuario) {
      console.error('[Auth Login] Usuario no encontrado para auth_id:', authData.user.id);
      if (await isDeletedRestaurantEmail(authData.user.email || email)) {
        return res.status(410).json({ error: true, code: 'RESTAURANTE_ELIMINADO', message: DELETED_RESTAURANT_MESSAGE });
      }
      return res.status(403).json({
        error: true,
        message: 'Tu cuenta no tiene acceso al sistema. Contacta al administrador.',
      });
    }

    if (usuario.rol !== 'admin_saas' && (!usuario.restaurante || usuario.restaurante.activo === false)) {
      return res.status(410).json({ error: true, code: 'RESTAURANTE_ELIMINADO', message: DELETED_RESTAURANT_MESSAGE });
    }

    // 3. Respuesta exitosa con token + datos del usuario
    res.json({
      data: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          auth_id: usuario.auth_id,
        },
        restaurante: usuario.restaurante,
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ error: true, message: 'Error interno del servidor.' });
  }
});

/**
 * POST /api/auth/crear-usuario
 * El admin crea un nuevo usuario con Supabase Auth + tabla usuario
 */
router.post('/crear-usuario', async (req, res) => {
  try {
    const { email, password, nombre, rol, id_restaurante } = req.body;

    // Validar campos requeridos
    if (!email || !password || !nombre || !rol || !id_restaurante) {
      return res.status(400).json({
        error: true,
        message: 'Campos requeridos: email, password, nombre, rol, id_restaurante',
      });
    }

    // Validar longitud de contraseña (requisito de Supabase)
    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: 'La contraseña debe tener al menos 6 caracteres.',
      });
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Auto-confirmar (no requiere verificación por email)
    });

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('existe')) {
        return res.status(409).json({ error: true, message: 'Ya existe un usuario con este email.' });
      }
      throw authError;
    }

    // 2. Insertar en la tabla usuario con el auth_id de Supabase
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .insert({
        auth_id: authData.user.id,
        email: email.trim().toLowerCase(),
        nombre,
        rol,
        id_restaurante,
      })
      .select()
      .single();

    if (userError) {
      // Rollback: si falla la inserción, eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    res.status(201).json({ data: usuario });
  } catch (err) {
    console.error('[Auth Crear Usuario Error]', err);
    res.status(500).json({ error: true, message: err.message || 'Error creando usuario.' });
  }
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado a partir de su token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verificar token con Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({ error: true, message: 'Token inválido o expirado.' });
    }

    // 2. Buscar usuario en nuestra tabla
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .select('*, restaurante(*)')
      .eq('auth_id', authData.user.id)
      .eq('activo', true)
      .single();

    if (userError || !usuario) {
      if (await isDeletedRestaurantEmail(authData.user.email)) {
        return res.status(410).json({ error: true, code: 'RESTAURANTE_ELIMINADO', message: DELETED_RESTAURANT_MESSAGE });
      }
      return res.status(403).json({ error: true, message: 'Usuario no encontrado o desactivado.' });
    }

    if (usuario.rol !== 'admin_saas' && (!usuario.restaurante || usuario.restaurante.activo === false)) {
      return res.status(410).json({ error: true, code: 'RESTAURANTE_ELIMINADO', message: DELETED_RESTAURANT_MESSAGE });
    }

    res.json({
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          auth_id: usuario.auth_id,
        },
        restaurante: usuario.restaurante,
      },
    });
  } catch (err) {
    console.error('[Auth Me Error]', err);
    res.status(500).json({ error: true, message: 'Error interno.' });
  }
});

/**
 * POST /api/auth/cambiar-password
 * El admin cambia la contraseña de cualquier usuario
 */
router.post('/cambiar-password', async (req, res) => {
  try {
    const { user_id, new_password } = req.body;

    if (!user_id || !new_password) {
      return res.status(400).json({ error: true, message: 'user_id y new_password son requeridos.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: true, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Buscar el auth_id del usuario
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .select('auth_id')
      .eq('id', user_id)
      .single();

    if (userError || !usuario?.auth_id) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado.' });
    }

    // Cambiar contraseña en Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.auth_id,
      { password: new_password }
    );

    if (updateError) throw updateError;

    res.json({ data: { message: 'Contraseña actualizada exitosamente.' } });
  } catch (err) {
    console.error('[Auth Cambiar Password Error]', err);
    res.status(500).json({ error: true, message: err.message || 'Error cambiando contraseña.' });
  }
});

/**
 * POST /api/auth/registrar-cliente
 * Registro público para comensales (clientes)
 */
router.post('/registrar-cliente', async (req, res) => {
  try {
    const { email, password, nombre, id_restaurante } = req.body;

    if (!email || !password || !nombre || !id_restaurante) {
      return res.status(400).json({ error: true, message: 'Faltan campos obligatorios.' });
    }

    // 1. Crear usuario en Supabase Auth usando el cliente normal para disparar OTP
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      if (authError.message?.includes('already')) {
        return res.status(409).json({ error: true, message: 'El email ya está registrado.' });
      }
      throw authError;
    }

    // Ya no insertamos en la tabla usuario aquí para evitar cuentas basura.
    // Solo le decimos al frontend que revise su correo.
    res.status(201).json({ message: 'OTP enviado con éxito al correo.', email: email.trim().toLowerCase() });
  } catch (err) {
    console.error('[Auth Registrar Cliente Error]', err);
    res.status(500).json({ error: true, message: err.message || 'Error en el registro.' });
  }
});

/**
 * POST /api/auth/completar-registro
 * Se llama DESPUÉS de que el cliente validó su OTP correctamente.
 * Inserta al usuario de forma oficial en la tabla `usuario`.
 */
router.post('/completar-registro', async (req, res) => {
  try {
    const { email, nombre, id_restaurante } = req.body;

    if (!email || !nombre || !id_restaurante) {
      return res.status(400).json({ error: true, message: 'Faltan campos obligatorios.' });
    }

    // 1. Obtener el auth_id buscando al usuario en Supabase Auth por email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = users.find(u => u.email === email.trim().toLowerCase());
    if (!authUser) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado en la autenticación.' });
    }

    // 2. Verificar si ya existe en nuestra tabla
    const { data: existente } = await supabaseAdmin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (existente) {
      return res.status(200).json({ message: 'El usuario ya estaba registrado en la base de datos.', data: existente });
    }

    // 3. Insertar en la tabla usuario (oficial)
    const { data: nuevoUsuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .insert({
        auth_id: authUser.id,
        email: email.trim().toLowerCase(),
        nombre,
        rol: 'cliente',
        id_restaurante,
      })
      .select()
      .single();

    if (userError) throw userError;

    res.status(201).json({ data: nuevoUsuario });
  } catch (err) {
    console.error('[Auth Completar Registro Error]', err);
    res.status(500).json({ error: true, message: err.message || 'Error al completar el registro.' });
  }
});

module.exports = router;
