const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();
const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * GET /api/productos
 * Lista todos los productos activos (con filtro por restaurante)
 * Publico para el menu, pero filtrado.
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante, id_categoria, disponible } = req.query;

    if (!id_restaurante) {
      return res.status(400).json({ error: true, message: 'id_restaurante es requerido' });
    }

    let query = supabase
      .from('producto')
      .select('*, categoria:id_categoria(id, nombre)')
      .is('deleted_at', null)
      .eq('id_restaurante', id_restaurante) // Filtro obligatorio
      .order('orden', { ascending: true });

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
 * Crea un nuevo producto (Protegido por Admin/Staff)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { id_categoria, nombre, descripcion, precio, imagen_url, disponible, stock, es_bebida, requiere_preparacion, orden } = req.body;
    
    // Forzamos el id_restaurante del usuario autenticado
    const id_restaurante = req.user.id_restaurante;

    if (!id_categoria || !nombre || precio === undefined) {
      return res.status(400).json({ error: true, message: 'Campos requeridos: id_categoria, nombre, precio' });
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
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    
    // Validar que el producto sea del inquilino antes de actualizar
    const { data: current } = await supabase.from('producto').select('id_restaurante').eq('id', req.params.id).single();
    if (current && current.id_restaurante !== req.user.id_restaurante && !req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para editar este producto' });
    }

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
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Validar tenant
    const { data: current } = await supabase.from('producto').select('id_restaurante').eq('id', req.params.id).single();
    if (current && current.id_restaurante !== req.user.id_restaurante && !req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'Error de permisos' });
    }

    const { data, error } = await supabase
      .from('producto')
      .update({ deleted_at: new Date().toISOString(), disponible: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, message: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
