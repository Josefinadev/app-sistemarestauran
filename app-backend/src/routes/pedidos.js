const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/pedidos
 * Lista pedidos con filtros
 */
router.get('/', async (req, res) => {
  try {
    const { id_restaurante, id_mesa, estado, estado_pago, limit: lim } = req.query;

    let query = supabase
      .from('pedido')
      .select(`
        *,
        mesa:id_mesa(id, numero, slug),
        detalle_pedido(
          *,
          producto:id_producto(id, nombre, precio, es_bebida),
          detalle_pedido_agregado(
            *,
            agregado:id_agregado(id, nombre, precio)
          )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (id_restaurante) query = query.eq('id_restaurante', id_restaurante);
    if (id_mesa) query = query.eq('id_mesa', id_mesa);
    if (estado) query = query.eq('estado', estado);
    if (estado_pago) query = query.eq('estado_pago', estado_pago);
    if (lim) query = query.limit(parseInt(lim));

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/pedidos/:id
 * Obtiene un pedido completo
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        mesa:id_mesa(id, numero, slug),
        detalle_pedido(
          *,
          producto:id_producto(id, nombre, precio, imagen_url, es_bebida),
          detalle_pedido_agregado(
            *,
            agregado:id_agregado(id, nombre, precio)
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Pedido no encontrado' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/pedidos
 * Crea un nuevo pedido con detalles (transacción atómica)
 * Body: { id_restaurante, id_mesa, notas?, items: [{ id_producto, notas?, agregados: [{ id_agregado }] }] }
 */
router.post('/', async (req, res) => {
  try {
    const { id_restaurante, id_mesa, id_usuario, notas, items } = req.body;

    if (!id_restaurante || !id_mesa || !items || !items.length) {
      return res.status(400).json({
        error: true,
        message: 'Campos requeridos: id_restaurante, id_mesa, items[]',
      });
    }

    // 1. Obtener precios actuales de productos
    const productIds = [...new Set(items.map((i) => i.id_producto))];
    const { data: productos, error: prodError } = await supabase
      .from('producto')
      .select('id, precio, disponible, stock')
      .in('id', productIds);

    if (prodError) throw prodError;

    const precioMap = {};
    for (const p of productos) {
      if (!p.disponible || p.stock <= 0) {
        return res.status(400).json({
          error: true,
          message: `Producto ${p.id} no disponible o sin stock`,
        });
      }
      precioMap[p.id] = p.precio;
    }

    // 2. Obtener precios de agregados
    const allAgregadoIds = items.flatMap((i) => (i.agregados || []).map((a) => a.id_agregado));
    let precioAgregadoMap = {};
    if (allAgregadoIds.length > 0) {
      const { data: agregados, error: agrError } = await supabase
        .from('agregado')
        .select('id, precio')
        .in('id', allAgregadoIds);

      if (agrError) throw agrError;
      for (const a of agregados) {
        precioAgregadoMap[a.id] = a.precio;
      }
    }

    // 3. Calcular totales
    let subtotal = 0;
    const detalles = items.map((item) => {
      const precioProducto = precioMap[item.id_producto] || 0;
      const precioAgregados = (item.agregados || []).reduce(
        (s, a) => s + (precioAgregadoMap[a.id_agregado] || 0),
        0
      );
      subtotal += precioProducto + precioAgregados;

      return {
        id_producto: item.id_producto,
        precio_unitario: precioProducto,
        notas: item.notas || null,
        agregados: (item.agregados || []).map((a) => ({
          id_agregado: a.id_agregado,
          precio_momento: precioAgregadoMap[a.id_agregado] || 0,
        })),
      };
    });

    // 4. Crear pedido
    const { data: pedido, error: pedError } = await supabase
      .from('pedido')
      .insert({
        id_restaurante,
        id_mesa,
        id_usuario: id_usuario || null,
        subtotal,
        total: subtotal,
        notas: notas || null,
      })
      .select()
      .single();

    if (pedError) throw pedError;

    // 5. Crear detalles
    for (const det of detalles) {
      const { data: detalle, error: detError } = await supabase
        .from('detalle_pedido')
        .insert({
          id_pedido: pedido.id,
          id_producto: det.id_producto,
          precio_unitario: det.precio_unitario,
          notas: det.notas,
        })
        .select()
        .single();

      if (detError) throw detError;

      // 6. Crear agregados del detalle
      if (det.agregados.length > 0) {
        const { error: agrDetError } = await supabase
          .from('detalle_pedido_agregado')
          .insert(
            det.agregados.map((a) => ({
              id_detalle_pedido: detalle.id,
              id_agregado: a.id_agregado,
              precio_momento: a.precio_momento,
            }))
          );

        if (agrDetError) throw agrDetError;
      }
    }

    // Retornar pedido creado completo
    const { data: pedidoCompleto } = await supabase
      .from('pedido')
      .select(`
        *,
        mesa:id_mesa(id, numero),
        detalle_pedido(
          *,
          producto:id_producto(id, nombre),
          detalle_pedido_agregado(*, agregado:id_agregado(id, nombre))
        )
      `)
      .eq('id', pedido.id)
      .single();

    res.status(201).json({ data: pedidoCompleto });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/pedidos/:id/estado
 * Actualiza el estado del pedido
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const validEstados = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: true, message: `Estado inválido. Válidos: ${validEstados.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('pedido')
      .update({ estado })
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
 * PATCH /api/pedidos/:id/pago
 * Registra el pago
 */
router.patch('/:id/pago', async (req, res) => {
  try {
    const { metodo_pago, comprobante_url } = req.body;
    const validMetodos = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA', 'OTRO'];

    if (!validMetodos.includes(metodo_pago)) {
      return res.status(400).json({ error: true, message: `Método inválido. Válidos: ${validMetodos.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('pedido')
      .update({
        estado_pago: 'PAGADO',
        metodo_pago,
        comprobante_url: comprobante_url || null,
        pagado_en: new Date().toISOString(),
      })
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
 * PATCH /api/pedidos/detalle/:id/estado
 * Actualiza el estado de un detalle individual (plato)
 */
router.patch('/detalle/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;

    const { data, error } = await supabase
      .from('detalle_pedido')
      .update({ estado })
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
