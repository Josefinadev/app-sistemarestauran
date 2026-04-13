const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/productos
 * Lista todos los productos activos (con filtro por restaurante)
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante, id_categoria, disponible } = req.query;

    let query = supabase
      .from('producto')
      .select('*, categoria:id_categoria(id, nombre)')
      .is('deleted_at', null)
      .order('orden', { ascending: true });

    if (id_restaurante) query = query.eq('id_restaurante', id_restaurante);
    if (id_categoria) query = query.eq('id_categoria', id_categoria);
    if (disponible !== undefined) query = query.eq('disponible', disponible === 'true');

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/productos/:id
 * Obtiene un producto con sus agregados
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: producto, error } = await supabase
      .from('producto')
      .select(`
        *,
        categoria:id_categoria(id, nombre),
        producto_grupo(
          grupo:id_grupo(
            id, nombre, min_seleccion, max_seleccion,
            agregado(id, nombre, precio, disponible)
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!producto) return res.status(404).json({ error: true, message: 'Producto no encontrado' });

    res.json({ data: producto });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/productos
 * Crea un nuevo producto
 */
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, id_categoria, nombre, descripcion, precio, imagen_url, disponible, stock, es_bebida, requiere_preparacion, orden } = req.body;

    if (!id_restaurante || !id_categoria || !nombre || precio === undefined) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_restaurante, id_categoria, nombre, precio' });
    }

    const { data, error } = await supabase
      .from('producto')
      .insert({
        id_restaurante, id_categoria, nombre, descripcion, precio, imagen_url,
        disponible, stock, es_bebida,
        requiere_preparacion: requiere_preparacion !== undefined ? requiere_preparacion : true,
        orden,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/productos/:id
 * Actualiza un producto
 */
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const { data, error } = await supabase
      .from('producto')
      .update(updates)
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
 * DELETE /api/productos/:id (Soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('producto')
      .update({ deleted_at: new Date().toISOString(), disponible: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, message: 'Producto desactivado (soft delete)' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
