const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();
const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * GET /api/mesas
 * Lista mesas por restaurante (Filtrado obligatorio)
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante } = req.query;

    if (!id_restaurante) {
      return res.status(400).json({ error: true, message: 'id_restaurante es requerido' });
    }

    let query = supabase
      .from('mesa')
      .select('*')
      .eq('id_restaurante', id_restaurante)
      .order('numero', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/mesas/slug/:slug
 * Obtiene una mesa por su slug (para QR) - Publico
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    let { data: mesa, error: mesaError } = await supabase
      .from('mesa')
      .select('*, restaurante:id_restaurante(id, nombre, slug, logo_url, hero_banner_url, color_primario, color_secundario, latitud, longitud, radio_permitido_metros)')
      .eq('slug', slug)
      .eq('activa', true)
      .single();

    if (!mesa || mesaError) {
      return res.status(404).json({ error: true, message: 'Mesa no encontrada con ese código QR' });
    }

    res.json({ data: mesa });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/mesas
 * Crea una nueva mesa (Admin)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede crear mesas.' });
    }
    const { numero, capacidad } = req.body;
    // Superadmin puede especificar el restaurante destino desde el body
    const id_restaurante = req.isSuperAdmin
      ? (req.body.id_restaurante || req.user.id_restaurante)
      : req.user.id_restaurante;

    if (!numero) {
      return res.status(400).json({ error: true, message: 'El número de mesa es requerido' });
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
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede editar mesas.' });
    }
    // Validar tenant
    const { data: current } = await supabase.from('mesa').select('id_restaurante').eq('id', req.params.id).single();
    if (current && current.id_restaurante !== req.user.id_restaurante && !req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'No tienes permiso' });
    }

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
