const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const router = express.Router();
const { authenticate, restrictToTenant } = require('../middleware/auth');

/**
 * Auth OPCIONAL para endpoints públicos-comensal.
 * Si hay Bearer token válido, hidrata req.user + req.isSuperAdmin (tenant check activo).
 * Si no hay token o es inválido, sigue sin autenticar (cliente comensal con UUID).
 */
async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return next();

    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('id, rol, id_restaurante')
      .eq('auth_id', authData.user.id)
      .eq('activo', true)
      .single();
    if (usuario) {
      req.user = usuario;
      req.isSuperAdmin = usuario.rol === 'admin_saas';
    }
    next();
  } catch {
    next();
  }
}

/**
 * GET /api/pedidos
 * Lista pedidos con filtros (Filtrado por tenant)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { id_mesa, estado, estado_pago, limit: lim } = req.query;

    let query = supabase
      .from('pedido')
      .select(`
        *,
        mesa:id_mesa(id, numero, slug),
        detalle_pedido(
          *,
          producto:id_producto(id, nombre, precio, imagen_url, es_bebida, requiere_preparacion),
          detalle_pedido_agregado(
            *,
            agregado:id_agregado(id, nombre, precio)
          )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Aplicar restricción de Tenant automática
    query = restrictToTenant(query, req);

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
 * Auth OPCIONAL: el cliente comensal (sin login con email) puede consultar el
 * estado de su pedido pasando solo el UUID en la URL. Si hay un usuario
 * autenticado (admin/cocina/mesero/caja), se aplica tenant isolation normal.
 * El UUID del pedido oficia de "token" — no es enumerable y se comparte
 * únicamente con el cliente a través del QR/redirect post-pedido.
 */
router.get('/:id', optionalAuth, async (req, res) => {
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

    // Tenant isolation SOLO si hay un usuario autenticado (no comensal guest)
    if (req.user && !req.isSuperAdmin && data?.id_restaurante !== req.user.id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes acceso a este pedido.' });
    }

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

    // Validar que la mesa pertenezca al restaurante
    const { data: mesa, error: mesaError } = await supabase
      .from('mesa')
      .select('id, id_restaurante')
      .eq('id', id_mesa)
      .single();
    if (mesaError) throw mesaError;
    if (!mesa || mesa.id_restaurante !== id_restaurante) {
      return res.status(400).json({ error: true, message: 'Mesa inválida para este restaurante.' });
    }

    // 1. Obtener precios actuales de productos (incluye requiere_preparacion)
    const productIds = [...new Set(items.map((i) => i.id_producto))];
    const { data: productos, error: prodError } = await supabase
      .from('producto')
      .select('id, precio, disponible, stock, requiere_preparacion, id_restaurante')
      .in('id', productIds);

    if (prodError) throw prodError;

    const precioMap = {};
    const prepMap = {}; // mapeo id_producto → requiere_preparacion
    const stockMap = {}; // mapeo id_producto → stock disponible
    for (const p of productos) {
      if (p.id_restaurante !== id_restaurante) {
        return res.status(400).json({ error: true, message: `Producto ${p.id} no pertenece al restaurante.` });
      }
      if (!p.disponible || p.stock <= 0) {
        return res.status(400).json({
          error: true,
          message: `Producto ${p.id} no disponible o sin stock`,
        });
      }
      precioMap[p.id] = p.precio;
      prepMap[p.id] = p.requiere_preparacion !== false; // default true
      stockMap[p.id] = p.stock;
    }

    // Validar que la cantidad pedida no exceda el stock
    const cantidadPorProducto = {};
    for (const item of items) {
      const qty = item.cantidad || 1;
      cantidadPorProducto[item.id_producto] = (cantidadPorProducto[item.id_producto] || 0) + qty;
    }
    for (const [prodId, cantidadTotal] of Object.entries(cantidadPorProducto)) {
      if (stockMap[prodId] !== undefined && cantidadTotal > stockMap[prodId]) {
        const prodName = productos.find(p => p.id === prodId)?.nombre || prodId;
        return res.status(400).json({
          error: true,
          message: `Stock insuficiente para "${prodName}". Disponible: ${stockMap[prodId]}, solicitado: ${cantidadTotal}`,
        });
      }
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
      const cantidad = item.cantidad || 1;
      const precioProducto = precioMap[item.id_producto] || 0;
      const precioAgregados = (item.agregados || []).reduce(
        (s, a) => s + (precioAgregadoMap[a.id_agregado] || 0),
        0
      );
      const precioTotalItem = (precioProducto + precioAgregados) * cantidad;
      subtotal += precioTotalItem;

      return {
        id_producto: item.id_producto,
        precio_unitario: precioProducto,
        cantidad,
        notas: item.notas || null,
        requiere_preparacion: prepMap[item.id_producto],
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

    // 5. Crear detalles (ruteo inteligente según requiere_preparacion)
    for (const det of detalles) {
      // Si NO requiere preparación → estado = LISTO (va directo al mesero)
      // Si SÍ requiere preparación → estado = PENDIENTE (pasa por cocina)
      const estadoInicial = det.requiere_preparacion ? 'PENDIENTE' : 'LISTO';

      for (let i = 0; i < det.cantidad; i += 1) {
        const { data: detalle, error: detError } = await supabase
          .from('detalle_pedido')
          .insert({
            id_pedido: pedido.id,
            id_producto: det.id_producto,
            precio_unitario: det.precio_unitario,
            notas: det.notas,
            estado: estadoInicial,
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

    // Descontar stock de los productos pedidos
    for (const [prodId, cantidadTotal] of Object.entries(cantidadPorProducto)) {
      const currentStock = stockMap[prodId] || 0;
      const newStock = Math.max(0, currentStock - Number(cantidadTotal));
      await supabase.from('producto').update({ stock: newStock }).eq('id', prodId);
    }

    res.status(201).json({ data: pedidoCompleto });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

router.patch('/:id/estado', authenticate, async (req, res) => {
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
    if (!req.isSuperAdmin && data?.id_restaurante !== req.user.id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes acceso a este pedido.' });
    }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

router.patch('/:id/pago', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin && !['caja', 'admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo caja/admin puede registrar pagos.' });
    }

    const { metodo_pago, comprobante_url, efectivo_recibido: efectivoRaw, detalle_ids } = req.body;
    const validMetodos = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA', 'BCP', 'OTRO'];
    let efectivo_recibido;

    if (!validMetodos.includes(metodo_pago)) {
      return res.status(400).json({ error: true, message: `Método inválido. Válidos: ${validMetodos.join(', ')}` });
    }

    if (detalle_ids !== undefined && (!Array.isArray(detalle_ids) || detalle_ids.length === 0)) {
      return res.status(400).json({ error: true, message: 'detalle_ids debe ser un arreglo con al menos un id válido.' });
    }

    if (efectivoRaw !== undefined) {
      if (typeof efectivoRaw === 'string') {
        if (efectivoRaw.trim() === '') {
          return res.status(400).json({ error: true, message: 'efectivo_recibido no puede estar vacío.' });
        }
        efectivo_recibido = Number(efectivoRaw);
      } else if (typeof efectivoRaw === 'number') {
        efectivo_recibido = efectivoRaw;
      } else {
        return res.status(400).json({ error: true, message: 'efectivo_recibido debe ser un número.' });
      }

      if (Number.isNaN(efectivo_recibido)) {
        return res.status(400).json({ error: true, message: 'efectivo_recibido debe ser un número válido.' });
      }
    }

    if (metodo_pago === 'EFECTIVO' && efectivo_recibido === undefined) {
      return res.status(400).json({ error: true, message: 'efectivo_recibido es requerido para pagos en efectivo.' });
    }

    const { data: pedidoMeta, error: pedidoMetaError } = await supabase
      .from('pedido')
      .select('id_restaurante')
      .eq('id', req.params.id)
      .single();

    if (pedidoMetaError) throw pedidoMetaError;
    if (!pedidoMeta) return res.status(404).json({ error: true, message: 'Pedido no encontrado.' });
    if (!req.isSuperAdmin && pedidoMeta.id_restaurante !== req.user.id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes acceso a este pedido.' });
    }

    let pagoCompletado = false;

    if (detalle_ids) {
      const { data: detalles, error: detallesError } = await supabase
        .from('detalle_pedido')
        .select('id, id_pedido, estado, precio_unitario, detalle_pedido_agregado(precio_momento)')
        .in('id', detalle_ids)
        .eq('id_pedido', req.params.id);

      if (detallesError) throw detallesError;
      if (!detalles || detalles.length !== detalle_ids.length) {
        return res.status(400).json({ error: true, message: 'Algunos ids de detalle no existen o no pertenecen al pedido.' });
      }

      const detallesValidos = detalles.filter((detalle) => detalle.estado !== 'ENTREGADO' && detalle.estado !== 'CANCELADO');
      if (detallesValidos.length === 0) {
        return res.status(400).json({ error: true, message: 'No hay ítems válidos para pagar en la selección.' });
      }

      const detalleTotal = detallesValidos.reduce((total, detalle) => {
        const agregadosTotal = (detalle.detalle_pedido_agregado || []).reduce((sum, agregado) => sum + Number(agregado.precio_momento || 0), 0);
        return total + ((Number(detalle.precio_unitario) || 0) + agregadosTotal);
      }, 0);

      if (efectivo_recibido !== undefined && efectivo_recibido < detalleTotal) {
        return res.status(400).json({ error: true, message: 'El monto recibido en efectivo es menor al total de los ítems seleccionados.' });
      }

      const validIds = detallesValidos.map((detalle) => detalle.id);

      const { error: actualizarDetallesError } = await supabase
        .from('detalle_pedido')
        .update({ estado: 'ENTREGADO' })
        .in('id', validIds)
        .neq('estado', 'ENTREGADO')
        .neq('estado', 'CANCELADO');

      if (actualizarDetallesError) throw actualizarDetallesError;

      const { data: pendientes, error: pendientesError } = await supabase
        .from('detalle_pedido')
        .select('id')
        .eq('id_pedido', req.params.id)
        .neq('estado', 'ENTREGADO')
        .neq('estado', 'CANCELADO');

      if (pendientesError) throw pendientesError;
      if (!pendientes || pendientes.length === 0) {
        pagoCompletado = true;
      }
    } else {
      pagoCompletado = true;
      const { error: actualizarDetallesError } = await supabase
        .from('detalle_pedido')
        .update({ estado: 'ENTREGADO' })
        .eq('id_pedido', req.params.id)
        .neq('estado', 'ENTREGADO')
        .neq('estado', 'CANCELADO');

      if (actualizarDetallesError) throw actualizarDetallesError;
    }

    let data;

    if (pagoCompletado) {
      const pedidoUpdate = {
        estado: 'ENTREGADO',
        estado_pago: 'PAGADO',
        metodo_pago,
        comprobante_url: comprobante_url || null,
        pagado_en: new Date().toISOString(),
      };

      const updateResult = await supabase
        .from('pedido')
        .update(pedidoUpdate)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateResult.error) throw updateResult.error;
      data = updateResult.data;
    } else {
      // Pago parcial: marcar pedido como MIXTO y guardar método usado
      const updatePartial = {
        // DB enum no contiene 'MIXTO' — usar 'PENDIENTE' para pagos parciales
        estado_pago: 'PENDIENTE',
        metodo_pago: metodo_pago,
        comprobante_url: comprobante_url || null,
      };

      const { error: updatePartialError } = await supabase
        .from('pedido')
        .update(updatePartial)
        .eq('id', req.params.id);

      if (updatePartialError) throw updatePartialError;

      const selectResult = await supabase
        .from('pedido')
        .select()
        .eq('id', req.params.id)
        .single();

      if (selectResult.error) throw selectResult.error;
      data = selectResult.data;
    }

    return res.json({ data, pagoCompletado });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/pedidos/detalle/batch/estado
 * Actualiza el estado de múltiples detalles en una sola petición.
 * Body: { ids: string[], estado: string }
 */
router.patch('/detalle/batch/estado', authenticate, async (req, res) => {
  try {
    const { ids, estado } = req.body;
    const validEstados = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: true, message: 'Se requiere un array de ids.' });
    }
    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: true, message: `Estado inválido. Válidos: ${validEstados.join(', ')}` });
    }

    // Actualizar todos los detalles de un golpe
    const { data, error } = await supabase
      .from('detalle_pedido')
      .update({ estado })
      .in('id', ids)
      .select('*, id_pedido');

    if (error) throw error;

    // Tenant isolation: verificar que todos los pedidos pertenecen al restaurante
    const pedidoIds = [...new Set((data || []).map(d => d.id_pedido))];
    if (pedidoIds.length > 0 && !req.isSuperAdmin) {
      const { data: pedidos } = await supabase
        .from('pedido')
        .select('id, id_restaurante')
        .in('id', pedidoIds);

      const unauthorized = (pedidos || []).find(p => p.id_restaurante !== req.user.id_restaurante);
      if (unauthorized) {
        return res.status(403).json({ error: true, message: 'No tienes acceso a estos pedidos.' });
      }
    }

    // Auto-sincronizar estado de los pedidos padre afectados
    for (const pedidoId of pedidoIds) {
      const { data: allDetalles } = await supabase
        .from('detalle_pedido')
        .select('estado')
        .eq('id_pedido', pedidoId);

      if (allDetalles && allDetalles.length > 0) {
        const estados = allDetalles.map(d => d.estado);
        let nuevoEstadoPedido;

        if (estados.every(e => e === 'ENTREGADO' || e === 'CANCELADO')) {
          nuevoEstadoPedido = 'ENTREGADO';
        } else if (estados.some(e => e === 'LISTO')) {
          nuevoEstadoPedido = 'LISTO';
        } else if (estados.some(e => e === 'EN_PREPARACION')) {
          nuevoEstadoPedido = 'EN_PREPARACION';
        } else {
          nuevoEstadoPedido = 'PENDIENTE';
        }

        await supabase
          .from('pedido')
          .update({ estado: nuevoEstadoPedido })
          .eq('id', pedidoId);
      }
    }

    res.json({ data, updated: (data || []).length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/pedidos/detalle/:id/estado
 * Actualiza el estado de un detalle individual (plato)
 */
router.patch('/detalle/:id/estado', authenticate, async (req, res) => {
  try {
    const { estado } = req.body;

    const { data, error } = await supabase
      .from('detalle_pedido')
      .update({ estado })
      .eq('id', req.params.id)
      .select('*, id_pedido')
      .single();

    if (error) throw error;

    // Tenant isolation por el pedido
    const { data: ped } = await supabase.from('pedido').select('id_restaurante').eq('id', data.id_pedido).single();
    if (!req.isSuperAdmin && ped?.id_restaurante !== req.user.id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes acceso a este pedido.' });
    }

    // Auto-sincronizar estado del pedido padre:
    // Si TODOS los detalles están ENTREGADO → pedido.estado = ENTREGADO
    // Si al menos uno está EN_PREPARACION → pedido.estado = EN_PREPARACION
    // Si al menos uno está LISTO → pedido.estado = LISTO
    if (data.id_pedido) {
      const { data: allDetalles } = await supabase
        .from('detalle_pedido')
        .select('estado')
        .eq('id_pedido', data.id_pedido);

      if (allDetalles && allDetalles.length > 0) {
        const estados = allDetalles.map(d => d.estado);
        let nuevoEstadoPedido;

        if (estados.every(e => e === 'ENTREGADO' || e === 'CANCELADO')) {
          nuevoEstadoPedido = 'ENTREGADO';
        } else if (estados.some(e => e === 'LISTO')) {
          nuevoEstadoPedido = 'LISTO';
        } else if (estados.some(e => e === 'EN_PREPARACION')) {
          nuevoEstadoPedido = 'EN_PREPARACION';
        } else {
          nuevoEstadoPedido = 'PENDIENTE';
        }

        await supabase
          .from('pedido')
          .update({ estado: nuevoEstadoPedido })
          .eq('id', data.id_pedido);
      }
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
