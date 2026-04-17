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
 * Si es slug de restaurante, devuelve la primera mesa disponible
 * Si es slug de mesa, devuelve esa mesa
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    // Primero intentar buscar por slug de mesa
    let { data: mesa, error: mesaError } = await supabase
      .from('mesa')
      .select('*, restaurante:id_restaurante(id, nombre, slug, latitud, longitud, radio_permitido_metros)')
      .eq('slug', slug)
      .eq('activa', true)
      .single();

    // Si no encuentra mesa, intentar por slug de restaurante
    if (!mesa || mesaError) {
      const { data: restaurante, error: restError } = await supabase
        .from('restaurante')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!restaurante || restError) {
        return res.status(404).json({ error: true, message: 'Mesa o restaurante no encontrado' });
      }

      // Obtener la primera mesa disponible del restaurante
      const { data: mesas, error: mesasError } = await supabase
        .from('mesa')
        .select('*, restaurante:id_restaurante(id, nombre, slug, latitud, longitud, radio_permitido_metros)')
        .eq('id_restaurante', restaurante.id)
        .eq('activa', true)
        .limit(1);

      if (mesasError || !mesas || mesas.length === 0) {
        return res.status(404).json({ error: true, message: 'No hay mesas disponibles' });
      }

      mesa = mesas[0];
    }

    res.json({ data: mesa });
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
