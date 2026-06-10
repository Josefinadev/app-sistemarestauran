const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const router = express.Router();
const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * GET /api/categorias
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante } = req.query;
    if (!id_restaurante) {
      return res.status(400).json({ error: true, message: 'id_restaurante es requerido' });
    }

    let query = supabase
      .from('categoria')
      .select('*, producto(count)')
      .eq('activo', true)
      .eq('id_restaurante', id_restaurante)
      .order('orden', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/categorias
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede crear categorías.' });
    }
    const { nombre, descripcion, imagen_url, orden } = req.body;
    // Superadmin puede especificar el restaurante destino desde el body
    const id_restaurante = req.isSuperAdmin
      ? (req.body.id_restaurante || req.user.id_restaurante)
      : req.user.id_restaurante;

    if (!id_restaurante || !nombre) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, nombre' });
    }

    const { data, error } = await supabaseAdmin
      .from('categoria')
      .insert({ id_restaurante, nombre, descripcion, imagen_url, orden: orden || 0 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/categorias/:id
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede editar categorías.' });
    }

    // Validar tenant
    const { data: current } = await supabaseAdmin.from('categoria').select('id_restaurante').eq('id', req.params.id).single();
    if (current && current.id_restaurante !== req.user.id_restaurante && !req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para editar esta categoría.' });
    }

    const { data, error } = await supabaseAdmin
      .from('categoria')
      .update(req.body)
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
 * DELETE /api/categorias/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede eliminar categorías.' });
    }

    const { data: current } = await supabaseAdmin.from('categoria').select('id_restaurante').eq('id', req.params.id).single();
    if (current && current.id_restaurante !== req.user.id_restaurante && !req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para eliminar esta categoría.' });
    }

    const { error } = await supabaseAdmin
      .from('categoria')
      .update({ activo: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
