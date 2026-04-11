const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/mesas
 * Lista mesas por restaurante
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante } = req.query;

    let query = supabase
      .from('mesa')
      .select('*')
      .order('numero', { ascending: true });

    if (id_restaurante) query = query.eq('id_restaurante', id_restaurante);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/mesas/slug/:slug
 * Obtiene una mesa por su slug (para QR)
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mesa')
      .select('*, restaurante:id_restaurante(*)')
      .eq('slug', req.params.slug)
      .eq('activa', true)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Mesa no encontrada' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/mesas
 * Crea una nueva mesa
 */
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, numero, capacidad } = req.body;

    if (!id_restaurante || !numero) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, numero' });
    }

    const { data, error } = await supabase
      .from('mesa')
      .insert({ id_restaurante, numero, capacidad: capacidad || 4 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/mesas/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mesa')
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
