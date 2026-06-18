const express = require('express');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const supabaseAdmin = require('../config/supabase-admin');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Configuración de Mercado Pago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const PRECIO_MENSUAL = 60; // S/60 por mes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'https://orderly-delta-cyan.vercel.app';

/**
 * Calcula el mes actual en formato YYYY-MM basado en una fecha de referencia
 */
function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcula los meses adeudados desde fecha_inicio hasta hoy
 * @param {Date} fechaInicio - Fecha de inicio de la suscripción
 * @returns {string[]} Array de meses en formato YYYY-MM
 */
function calcularMesesDesde(fechaInicio) {
  const meses = [];
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  
  let current = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  
  while (current <= fin) {
    meses.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
    current.setMonth(current.getMonth() + 1);
  }
  
  return meses;
}

/**
 * POST /api/pagos/crear-preferencia
 * Crea una preferencia de pago en Mercado Pago
 * 
 * Para registro nuevo: { es_registro: true, datos_restaurante: {...} }
 * Para pago mensual: { id_restaurante: "uuid", meses_a_pagar: ["2026-07"] }
 */
router.post('/crear-preferencia', async (req, res) => {
  try {
    const { es_registro, datos_restaurante, id_restaurante, meses_a_pagar } = req.body;
    
    let items = [];
    let metadata = {};
    let external_reference = '';
    
    if (es_registro && datos_restaurante) {
      // ─── REGISTRO NUEVO ───
      const mesActual = getMesActual();
      
      items = [{
        id: 'primer-mes',
        title: `RestaurantOS - Primer mes (${mesActual})`,
        description: `Suscripción mensual para ${datos_restaurante.nombre}`,
        quantity: 1,
        unit_price: PRECIO_MENSUAL,
        currency_id: 'PEN'
      }];
      
      metadata = {
        tipo: 'registro',
        datos_restaurante: JSON.stringify(datos_restaurante),
        mes: mesActual
      };
      
      external_reference = `registro_${Date.now()}_${datos_restaurante.slug}`;
      
    } else if (id_restaurante && meses_a_pagar && meses_a_pagar.length > 0) {
      // ─── PAGO DE MENSUALIDADES ───
      const cantidadMeses = meses_a_pagar.length;
      const montoTotal = cantidadMeses * PRECIO_MENSUAL;
      
      const descripcionMeses = cantidadMeses === 1 
        ? meses_a_pagar[0] 
        : `${meses_a_pagar[0]} a ${meses_a_pagar[meses_a_pagar.length - 1]}`;
      
      items = [{
        id: 'mensualidad',
        title: `RestaurantOS - Mensualidad${cantidadMeses > 1 ? 'es' : ''} (${descripcionMeses})`,
        description: `Pago de ${cantidadMeses} mes${cantidadMeses > 1 ? 'es' : ''}`,
        quantity: cantidadMeses,
        unit_price: PRECIO_MENSUAL,
        currency_id: 'PEN'
      }];
      
      metadata = {
        tipo: 'mensualidad',
        id_restaurante,
        meses: JSON.stringify(meses_a_pagar)
      };
      
      external_reference = `mensualidad_${id_restaurante}_${Date.now()}`;
      
    } else {
      return res.status(400).json({ 
        error: true, 
        message: 'Datos inválidos. Se requiere es_registro + datos_restaurante O id_restaurante + meses_a_pagar' 
      });
    }
    
    // Crear preferencia en Mercado Pago
    const preference = new Preference(mpClient);
    
    const preferenceData = {
      items,
      metadata,
      external_reference,
      back_urls: {
        success: es_registro 
          ? `${FRONTEND_URL}/login?pago=exitoso&nuevo=true`
          : `${FRONTEND_URL}/dashboard?pago=exitoso`,
        failure: es_registro
          ? `${FRONTEND_URL}/?pago=fallido`
          : `${FRONTEND_URL}/dashboard/pagos?pago=fallido`,
        pending: es_registro
          ? `${FRONTEND_URL}/?pago=pendiente`
          : `${FRONTEND_URL}/dashboard/pagos?pago=pendiente`
      },
      auto_return: 'approved',
      notification_url: `${BACKEND_URL}/api/pagos/webhook`,
      statement_descriptor: 'RestaurantOS'
    };
    
    const response = await preference.create({ body: preferenceData });
    
    res.json({
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      preference_id: response.id
    });
    
  } catch (err) {
    console.error('[Crear Preferencia Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/pagos/webhook
 * Webhook que recibe notificaciones de Mercado Pago
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Solo procesamos notificaciones de pago
    if (type !== 'payment') {
      return res.sendStatus(200);
    }
    
    const paymentId = data?.id;
    if (!paymentId) {
      return res.sendStatus(200);
    }
    
    // Obtener detalles del pago desde Mercado Pago
    const payment = new Payment(mpClient);
    const paymentInfo = await payment.get({ id: paymentId });
    
    // Solo procesamos pagos aprobados
    if (paymentInfo.status !== 'approved') {
      console.log(`[Webhook] Pago ${paymentId} con estado: ${paymentInfo.status}`);
      return res.sendStatus(200);
    }
    
    const metadata = paymentInfo.metadata || {};
    const tipo = metadata.tipo;
    
    if (tipo === 'registro') {
      // ─── CREAR RESTAURANTE NUEVO ───
      await procesarPagoRegistro(paymentInfo, metadata);
    } else if (tipo === 'mensualidad') {
      // ─── REGISTRAR PAGO DE MENSUALIDAD ───
      await procesarPagoMensualidad(paymentInfo, metadata);
    }
    
    res.sendStatus(200);
    
  } catch (err) {
    console.error('[Webhook Error]', err);
    // Siempre devolver 200 para que MP no reintente
    res.sendStatus(200);
  }
});

/**
 * Procesa el pago de un registro nuevo y crea el restaurante
 */
async function procesarPagoRegistro(paymentInfo, metadata) {
  const datosRestaurante = JSON.parse(metadata.datos_restaurante);
  const mes = metadata.mes;
  
  const { 
    nombre, 
    slug, 
    propietario_nombre, 
    propietario_email, 
    propietario_password,
    color_primario,
    color_secundario,
    logo_url,
    hero_banner_url,
    latitud,
    longitud,
    radio_permitido_metros
  } = datosRestaurante;
  
  // 1. Verificar que no exista el restaurante (por si acaso)
  const { data: existente } = await supabaseAdmin
    .from('restaurante')
    .select('id')
    .eq('slug', slug.toLowerCase().trim())
    .single();
  
  if (existente) {
    console.log(`[Webhook] Restaurante ${slug} ya existe, omitiendo creación`);
    return;
  }
  
  // 2. Crear el restaurante
  const { data: restaurante, error: restError } = await supabaseAdmin
    .from('restaurante')
    .insert({
      nombre,
      slug: slug.toLowerCase().trim(),
      moneda: 'PEN',
      color_primario: color_primario || '#C5A059',
      color_secundario: color_secundario || '#E2725B',
      logo_url: logo_url || null,
      hero_banner_url: hero_banner_url || null,
      latitud: latitud !== undefined ? latitud : -12.046374,
      longitud: longitud !== undefined ? longitud : -77.042793,
      radio_permitido_metros: radio_permitido_metros || 500,
      activo: true
    })
    .select()
    .single();
  
  if (restError) throw restError;
  
  // 3. Crear suscripción básica (mantener compatibilidad con sistema anterior)
  const { data: planBasico } = await supabaseAdmin
    .from('suscripcion_plan')
    .select('id')
    .eq('nombre', 'Básico')
    .single();
  
  if (planBasico) {
    await supabaseAdmin.from('restaurante_suscripcion').insert({
      id_restaurante: restaurante.id,
      id_plan: planBasico.id,
      estado: 'activa',
      fecha_inicio: new Date().toISOString()
    });
  }
  
  // 4. Crear el propietario en Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: propietario_email.trim().toLowerCase(),
    password: propietario_password,
    email_confirm: true,
  });
  
  if (authError) throw authError;
  
  // 5. Crear el usuario propietario
  await supabaseAdmin
    .from('usuario')
    .insert({
      id_restaurante: restaurante.id,
      auth_id: authData.user.id,
      email: propietario_email.trim().toLowerCase(),
      nombre: propietario_nombre || 'Propietario',
      rol: 'propietario'
    });
  
  // 6. Registrar el pago del primer mes
  await supabaseAdmin
    .from('pago_mensualidad')
    .insert({
      id_restaurante: restaurante.id,
      mes_anio: mes,
      monto: PRECIO_MENSUAL,
      estado: 'pagado',
      preference_id: paymentInfo.preference_id,
      payment_id: String(paymentInfo.id),
      pagado_en: new Date().toISOString()
    });
  
  console.log(`[Webhook] Restaurante ${nombre} creado exitosamente con pago de ${mes}`);
}

/**
 * Procesa el pago de mensualidades de un restaurante existente
 */
async function procesarPagoMensualidad(paymentInfo, metadata) {
  const idRestaurante = metadata.id_restaurante;
  const meses = JSON.parse(metadata.meses);
  
  for (const mes of meses) {
    // Upsert para evitar duplicados
    await supabaseAdmin
      .from('pago_mensualidad')
      .upsert({
        id_restaurante: idRestaurante,
        mes_anio: mes,
        monto: PRECIO_MENSUAL,
        estado: 'pagado',
        preference_id: paymentInfo.preference_id,
        payment_id: String(paymentInfo.id),
        pagado_en: new Date().toISOString()
      }, {
        onConflict: 'id_restaurante,mes_anio'
      });
  }
  
  console.log(`[Webhook] Pagos registrados para restaurante ${idRestaurante}: ${meses.join(', ')}`);
}

/**
 * GET /api/pagos/estado/:id_restaurante
 * Obtiene el estado de pagos de un restaurante
 */
router.get('/estado/:id_restaurante', authenticate, async (req, res) => {
  try {
    const { id_restaurante } = req.params;
    
    // Verificar permisos
    if (!req.isSuperAdmin && req.user.id_restaurante !== id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para ver estos datos' });
    }
    
    // Obtener fecha de creación del restaurante
    const { data: restaurante, error: restError } = await supabaseAdmin
      .from('restaurante')
      .select('created_at, nombre')
      .eq('id', id_restaurante)
      .single();
    
    if (restError || !restaurante) {
      return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });
    }
    
    // Calcular todos los meses que debería haber pagado
    const mesesRequeridos = calcularMesesDesde(restaurante.created_at);
    
    // Obtener meses pagados
    const { data: pagosPagados } = await supabaseAdmin
      .from('pago_mensualidad')
      .select('mes_anio')
      .eq('id_restaurante', id_restaurante)
      .eq('estado', 'pagado');
    
    const mesesPagados = (pagosPagados || []).map(p => p.mes_anio);
    
    // Calcular meses pendientes
    const mesesPendientes = mesesRequeridos.filter(m => !mesesPagados.includes(m));
    
    // Calcular deuda
    const deudaTotal = mesesPendientes.length * PRECIO_MENSUAL;
    
    // Verificar si está al día (tiene pagado el mes actual basado en su ciclo)
    const mesActual = getMesActual();
    const alDia = mesesPagados.includes(mesActual) || !mesesRequeridos.includes(mesActual);
    
    res.json({
      restaurante: restaurante.nombre,
      fecha_inicio: restaurante.created_at,
      meses_requeridos: mesesRequeridos,
      meses_pagados: mesesPagados,
      meses_pendientes: mesesPendientes,
      deuda_total: deudaTotal,
      precio_mensual: PRECIO_MENSUAL,
      al_dia: alDia,
      mes_actual: mesActual
    });
    
  } catch (err) {
    console.error('[Estado Pagos Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/pagos/historial/:id_restaurante
 * Obtiene el historial de pagos de un restaurante
 */
router.get('/historial/:id_restaurante', authenticate, async (req, res) => {
  try {
    const { id_restaurante } = req.params;
    
    // Verificar permisos
    if (!req.isSuperAdmin && req.user.id_restaurante !== id_restaurante) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para ver estos datos' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('pago_mensualidad')
      .select('*')
      .eq('id_restaurante', id_restaurante)
      .order('mes_anio', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
    
  } catch (err) {
    console.error('[Historial Pagos Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/pagos/verificar-acceso/:id_restaurante
 * Verifica si un restaurante tiene acceso (para uso público en la web del restaurante)
 */
router.get('/verificar-acceso/:id_restaurante', async (req, res) => {
  try {
    const { id_restaurante } = req.params;
    
    // Obtener fecha de creación del restaurante
    const { data: restaurante, error: restError } = await supabaseAdmin
      .from('restaurante')
      .select('created_at, activo')
      .eq('id', id_restaurante)
      .single();
    
    if (restError || !restaurante) {
      return res.json({ tiene_acceso: false, motivo: 'restaurante_no_encontrado' });
    }
    
    if (!restaurante.activo) {
      return res.json({ tiene_acceso: false, motivo: 'restaurante_inactivo' });
    }
    
    // Verificar si tiene pagado el mes actual
    const mesActual = getMesActual();
    
    const { data: pago } = await supabaseAdmin
      .from('pago_mensualidad')
      .select('id')
      .eq('id_restaurante', id_restaurante)
      .eq('mes_anio', mesActual)
      .eq('estado', 'pagado')
      .single();
    
    if (pago) {
      return res.json({ tiene_acceso: true });
    }
    
    // Verificar si el restaurante fue creado este mes (tiene gracia hasta fin de mes)
    const fechaCreacion = new Date(restaurante.created_at);
    const mesCreacion = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, '0')}`;
    
    if (mesCreacion === mesActual) {
      // Fue creado este mes, verificar si tiene el pago del primer mes
      const { data: primerPago } = await supabaseAdmin
        .from('pago_mensualidad')
        .select('id')
        .eq('id_restaurante', id_restaurante)
        .eq('estado', 'pagado')
        .limit(1);
      
      if (primerPago && primerPago.length > 0) {
        return res.json({ tiene_acceso: true });
      }
    }
    
    return res.json({ tiene_acceso: false, motivo: 'pago_pendiente' });
    
  } catch (err) {
    console.error('[Verificar Acceso Error]', err);
    res.json({ tiene_acceso: false, motivo: 'error' });
  }
});

module.exports = router;
