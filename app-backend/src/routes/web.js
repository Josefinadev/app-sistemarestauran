const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ── CONFIGURACIÓN WEB ──

// Obtener configuración del restaurante
router.get('/config/:id_restaurante', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('web_config')
      .select('*')
      .eq('id_restaurante', req.params.id_restaurante)
      .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: true, message: err.message || 'Error obteniendo configuración web.' });
  }
});

// Guardar/Actualizar configuración
router.post('/config', async (req, res) => {
  try {
    const { id_restaurante, ...config } = req.body;
    const { data, error } = await supabase
      .from('web_config')
      .upsert({ id_restaurante, ...config, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: true, message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message || 'Error guardando configuración web.' });
  }
});

// ── COMBOS ──

// Obtener combos activos
router.get('/combos/:id_restaurante', async (req, res) => {
  const { data, error } = await supabase
    .from('web_combo')
    .select('*')
    .eq('id_restaurante', req.params.id_restaurante)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Crear combo
router.post('/combos', async (req, res) => {
  const { data, error } = await supabase
    .from('web_combo')
    .insert([req.body])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Actualizar combo
router.put('/combos/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('web_combo')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Eliminar combo
router.delete('/combos/:id', async (req, res) => {
  const { error } = await supabase
    .from('web_combo')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ── OFERTAS ──

// Obtener ofertas activas
router.get('/ofertas/:id_restaurante', async (req, res) => {
  const { data, error } = await supabase
    .from('web_oferta')
    .select('*')
    .eq('id_restaurante', req.params.id_restaurante)
    .eq('activo', true);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Crear oferta
router.post('/ofertas', async (req, res) => {
  const { data, error } = await supabase
    .from('web_oferta')
    .insert([req.body])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Actualizar oferta
router.put('/ofertas/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('web_oferta')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Eliminar oferta
router.delete('/ofertas/:id', async (req, res) => {
  const { error } = await supabase
    .from('web_oferta')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
