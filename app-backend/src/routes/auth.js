const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const router = express.Router();

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
      return res.status(403).json({
        error: true,
        message: 'Tu cuenta no tiene acceso al sistema. Contacta al administrador.',
      });
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
      return res.status(403).json({ error: true, message: 'Usuario no encontrado o desactivado.' });
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

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes('already')) {
        return res.status(409).json({ error: true, message: 'El email ya está registrado.' });
      }
      throw authError;
    }

    // 2. Insertar en tabla usuario con rol 'cliente' forzado
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .insert({
        auth_id: authData.user.id,
        email: email.trim().toLowerCase(),
        nombre,
        rol: 'cliente',
        id_restaurante,
      })
      .select()
      .single();

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    res.status(201).json({ data: usuario });
  } catch (err) {
    console.error('[Auth Registrar Cliente Error]', err);
    res.status(500).json({ error: true, message: err.message || 'Error en el registro.' });
  }
});

module.exports = router;
