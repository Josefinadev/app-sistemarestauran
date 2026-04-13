const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/usuarios
 * Lista usuarios por restaurante
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante, rol } = req.query;

    let query = supabase
      .from('usuario')
      .select('*')
      .order('created_at', { ascending: false });

    if (id_restaurante) query = query.eq('id_restaurante', id_restaurante);
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
 * Crear nuevo usuario
 */
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, nombre, email, rol } = req.body;

    if (!id_restaurante || !nombre || !rol) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, nombre, rol' });
    }

    const { data, error } = await supabase
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
 */
router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
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
 * DELETE /api/usuarios/:id (soft delete — desactivar)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .update({ activo: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, message: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
