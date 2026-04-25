const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const router = express.Router();

const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * GET /api/usuarios
 * Lista usuarios por restaurante (Filtrado por tenant)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { rol } = req.query;

    let query = supabaseAdmin
      .from('usuario')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar restricción de Tenant automática
    query = restrictToTenant(query, req);

    if (rol) query = query.eq('rol', rol);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/usuarios
 * Crear nuevo usuario (sin auth — solo tabla)
 * Para crear con autenticación real, usar POST /api/auth/crear-usuario
 */
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, nombre, email, rol } = req.body;

    if (!id_restaurante || !nombre || !rol) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, nombre, rol' });
    }

    const { data, error } = await supabaseAdmin
      .from('usuario')
      .insert({ id_restaurante, nombre, email: email || null, rol })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/usuarios/:id
 * Editar usuario — sincroniza email con Supabase Auth si tiene auth_id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, email, rol, activo } = req.body;
    const updateData = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (rol !== undefined) updateData.rol = rol;
    if (activo !== undefined) updateData.activo = activo;

    // 1. Obtener el usuario actual para saber si tiene auth_id
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('usuario')
      .select('auth_id, email')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Si tiene auth_id y el email cambió, actualizar en Supabase Auth
    if (currentUser?.auth_id && email && email !== currentUser.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        currentUser.auth_id,
        { email: email.trim().toLowerCase() }
      );
      if (authError) {
        console.error('[Usuarios PATCH] Error updating auth email:', authError.message);
        return res.status(400).json({
          error: true,
          message: authError.message.includes('already')
            ? 'Ya existe otro usuario con ese email.'
            : `Error actualizando email en Auth: ${authError.message}`,
        });
      }
    }

    // 3. Actualizar en la tabla usuario
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario PERMANENTEMENTE de la BD y de Supabase Auth
 */
router.delete('/:id', async (req, res) => {
  try {
    // 1. Obtener el auth_id del usuario antes de eliminarlo
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('usuario')
      .select('auth_id, nombre, email')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Eliminar de Supabase Auth si tiene auth_id
    if (user?.auth_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
      if (authError) {
        console.error('[Usuarios DELETE] Error deleting from Auth:', authError.message);
        // Continuar con la eliminación de la BD aunque falle en Auth
      }
    }

    // 3. Eliminar de la tabla usuario (hard delete)
    const { error: deleteError } = await supabaseAdmin
      .from('usuario')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ data: { message: `Usuario ${user?.nombre || ''} eliminado permanentemente.` } });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
