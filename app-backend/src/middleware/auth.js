const supabaseAdmin = require('../config/supabase-admin');

/**
 * Middleware para autenticar usuarios y extraer su restaurante (SaaS Tenant Isolation)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Acceso no autorizado. Token faltante.' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verificar token con Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: true, message: 'Sesión expirada o token inválido.' });
    }

    // 2. Buscar perfil de usuario para obtener el id_restaurante y rol
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .select('id, nombre, email, rol, id_restaurante')
      .eq('auth_id', authData.user.id)
      .eq('activo', true)
      .single();

    if (userError || !usuario) {
      return res.status(403).json({ error: true, message: 'Usuario no encontrado o desactivado.' });
    }

    // 3. Adjuntar info al request para ser usada en los controladores
    req.user = usuario;
    
    // Superadmin puede ignorar la restricción de tenant si lo desea (o pasar el id_restaurante por query)
    req.isSuperAdmin = usuario.rol === 'admin_saas';

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    res.status(500).json({ error: true, message: 'Error de autenticación servidor.' });
  }
};

/**
 * Helper para forzar el filtro de id_restaurante en las queries de Supabase.
 * Evita que un usuario de un restaurante vea datos de otro.
 */
const restrictToTenant = (query, req) => {
  if (req.isSuperAdmin) {
    // Si es superadmin y pasa un id_restaurante en query params, lo usamos.
    const { id_restaurante } = req.query;
    if (id_restaurante) return query.eq('id_restaurante', id_restaurante);
    return query; // Si no pasa nada, ve todo (peligroso, pero es superadmin)
  }
  
  // Para cualquier otro rol, FORZAMOS su propio id_restaurante
  return query.eq('id_restaurante', req.user.id_restaurante);
};

module.exports = { authenticate, restrictToTenant };
