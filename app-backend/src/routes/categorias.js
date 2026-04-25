const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();
const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * GET /api/categorias
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let query = supabase
      .from('categoria')
      .select('*, producto(count)')
      .eq('activo', true)
      .order('orden', { ascending: true });

    // Aplicar restricción de Tenant automática
    query = restrictToTenant(query, req);

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
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, nombre, descripcion, imagen_url, orden } = req.body;

    if (!id_restaurante || !nombre) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, nombre' });
    }

    const { data, error } = await supabase
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
router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
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

module.exports = router;
