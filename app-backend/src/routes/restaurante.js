const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/restaurante/:slug
 * Obtiene datos del restaurante por slug (para validar geolocalización)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurante')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('activo', true)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/restaurante/:slug/validar-ubicacion
 * Valida si las coordenadas del cliente están dentro del radio
 */
router.post('/:slug/validar-ubicacion', async (req, res) => {
  try {
    const { latitud, longitud } = req.body;

    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({ error: true, message: 'Se requieren latitud y longitud' });
    }

    const { data: restaurante, error } = await supabase
      .from('restaurante')
      .select('latitud, longitud, radio_permitido_metros')
      .eq('slug', req.params.slug)
      .single();

    if (error) throw error;
    if (!restaurante) return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });

    // Fórmula de Haversine
    const R = 6371e3;
    const φ1 = (latitud * Math.PI) / 180;
    const φ2 = (restaurante.latitud * Math.PI) / 180;
    const Δφ = ((restaurante.latitud - latitud) * Math.PI) / 180;
    const Δλ = ((restaurante.longitud - longitud) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const distancia = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dentroDelRadio = distancia <= restaurante.radio_permitido_metros;

    res.json({
      data: {
        permitido: dentroDelRadio,
        distancia_metros: Math.round(distancia),
        radio_metros: restaurante.radio_permitido_metros,
      },
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
