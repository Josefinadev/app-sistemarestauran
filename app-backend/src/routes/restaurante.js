const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const DELETED_RESTAURANT_MESSAGE = 'Tu restaurante ha sido eliminado. Contacta al Superadmin si crees que se trata de un error.';

function emailHash(email) {
  return crypto.createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');
}

function storagePathFromPublicUrl(url, bucket) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + marker.length).split('?')[0];
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

async function removeStorageObjects(urls, bucket) {
  const paths = [...new Set((urls || []).map((url) => storagePathFromPublicUrl(url, bucket)).filter(Boolean))];
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
  if (error) {
    console.warn(`[Delete Restaurant] No se pudieron eliminar archivos de ${bucket}:`, error.message);
  }
}

async function deleteByIds(table, column, ids) {
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin.from(table).delete().in(column, ids);
  if (error) throw error;
}

async function deleteByRestaurant(table, idRestaurante) {
  const { error } = await supabaseAdmin.from(table).delete().eq('id_restaurante', idRestaurante);
  if (error) throw error;
}

/**
 * GET /api/restaurante
 * Lista todos los restaurantes activos (para web pública)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurante')
      .select('*')
      .eq('activo', true);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * GET /api/restaurante/:slug
 * Obtiene datos del restaurante por slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurante')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: true, message: 'Restaurante no encontrado' });

    res.json(data);
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
    
    // Si no hay radio definido, permitimos (o usamos un default de 500m)
    const radio = restaurante.radio_permitido_metros || 500;
    const dentroDelRadio = distancia <= radio;

    res.json({
      dentroDelRadio,
      distancia_metros: Math.round(distancia),
      radio_metros: radio,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * POST /api/restaurante
 * Crear un nuevo restaurante + suscripción básica + usuario propietario
 */
router.post('/', async (req, res) => {
  try {
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
    } = req.body;

    if (!nombre || !slug || !propietario_email || !propietario_password) {
      return res.status(400).json({ 
        error: true, 
        message: 'Faltan campos requeridos: nombre, slug, propietario_email, propietario_password' 
      });
    }

    // 1. Crear el restaurante
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
        radio_permitido_metros: radio_permitido_metros || 500
      })
      .select()
      .single();

    if (restError) throw restError;

    // 2. Crear suscripción básica
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

    // 3. Crear el propietario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: propietario_email.trim().toLowerCase(),
      password: propietario_password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 4. Crear el usuario propietario
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuario')
      .insert({
        id_restaurante: restaurante.id,
        auth_id: authData.user.id,
        email: propietario_email.trim().toLowerCase(),
        nombre: propietario_nombre || 'Propietario',
        rol: 'propietario'
      })
      .select()
      .single();

    if (userError) throw userError;

    res.status(201).json({
      data: {
        restaurante,
        usuario
      }
    });

  } catch (err) {
    console.error('[Create Restaurant Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/restaurante/:id
 * Actualización general del restaurante. Solo SuperAdmin.
 * Permite actualizar nombre, slug, colores, ubicación, radio, logo, banner.
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Solo SuperAdmin puede usar este endpoint general
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'Solo el Superadmin puede editar restaurantes.' });
    }

    const { id } = req.params;

    // Campos permitidos para actualización
    const allowed = [
      'nombre', 'slug', 'color_primario', 'color_secundario',
      'logo_url', 'hero_banner_url', 'latitud', 'longitud',
      'radio_permitido_metros', 'direccion', 'telefono'
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No hay datos para actualizar.' });
    }

    // Si se actualiza el slug, normalizarlo
    if (updates.slug) {
      updates.slug = String(updates.slug).toLowerCase().trim();
    }

    const { data, error } = await supabaseAdmin
      .from('restaurante')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[Update Restaurant Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * PATCH /api/restaurante/:id/branding
 * Actualiza identidad visual del restaurante autenticado.
 */
router.patch('/:id/branding', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede actualizar la identidad visual.' });
    }

    if (!req.isSuperAdmin && req.user.id_restaurante !== id) {
      return res.status(403).json({ error: true, message: 'No tienes permiso para actualizar este restaurante.' });
    }

    const allowed = ['color_primario', 'color_secundario', 'logo_url', 'hero_banner_url'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key] || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No hay datos de identidad visual para actualizar.' });
    }

    const { data, error } = await supabaseAdmin
      .from('restaurante')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error('[Update Restaurant Branding Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * DELETE /api/restaurante/:id
 * Eliminación completa de tenant. Solo Superadmin.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: true, message: 'Solo el Superadmin puede eliminar restaurantes.' });
    }

    const { id } = req.params;

    const { data: restaurante, error: restError } = await supabaseAdmin
      .from('restaurante')
      .select('*')
      .eq('id', id)
      .single();

    if (restError || !restaurante) {
      return res.status(404).json({ error: true, message: 'Restaurante no encontrado.' });
    }

    const [usuariosRes, pedidosRes, productosRes, categoriasRes, gruposRes, promocionesRes, webCombosRes, webOfertasRes] = await Promise.all([
      supabaseAdmin.from('usuario').select('id, email, auth_id, rol').eq('id_restaurante', id),
      supabaseAdmin.from('pedido').select('id, comprobante_url').eq('id_restaurante', id),
      supabaseAdmin.from('producto').select('id, imagen_url').eq('id_restaurante', id),
      supabaseAdmin.from('categoria').select('id, imagen_url').eq('id_restaurante', id),
      supabaseAdmin.from('grupo_agregados').select('id').eq('id_restaurante', id),
      supabaseAdmin.from('promocion').select('id, imagen_url').eq('id_restaurante', id),
      supabaseAdmin.from('web_combo').select('id, imagen_url').eq('id_restaurante', id),
      supabaseAdmin.from('web_oferta').select('id, imagen_url').eq('id_restaurante', id),
    ]);

    for (const result of [usuariosRes, pedidosRes, productosRes, categoriasRes, gruposRes, promocionesRes, webCombosRes, webOfertasRes]) {
      if (result.error) throw result.error;
    }

    const usuariosDelRestaurante = usuariosRes.data || [];
    const superadminsVinculados = usuariosDelRestaurante.filter((u) => u.rol === 'admin_saas');
    const usuarios = usuariosDelRestaurante.filter((u) => u.rol !== 'admin_saas');
    const pedidos = pedidosRes.data || [];
    const productos = productosRes.data || [];
    const grupos = gruposRes.data || [];
    const pedidoIds = pedidos.map((p) => p.id);
    const productoIds = productos.map((p) => p.id);
    const grupoIds = grupos.map((g) => g.id);

    if (superadminsVinculados.length > 0) {
      const { data: fallbackRestaurante, error: fallbackError } = await supabaseAdmin
        .from('restaurante')
        .select('id')
        .neq('id', id)
        .eq('activo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackError) throw fallbackError;

      if (!fallbackRestaurante?.id) {
        return res.status(409).json({
          error: true,
          message: 'No se puede eliminar este restaurante porque hay una cuenta Superadmin vinculada y no existe otro restaurante activo para reasignarla.',
        });
      }

      const { error: reassignError } = await supabaseAdmin
        .from('usuario')
        .update({ id_restaurante: fallbackRestaurante.id })
        .in('id', superadminsVinculados.map((u) => u.id));

      if (reassignError) throw reassignError;
    }

    const hashes = [...new Set(usuarios.map((u) => u.email).filter(Boolean).map(emailHash))];
    if (hashes.length > 0) {
      const { error: markerError } = await supabaseAdmin
        .from('restaurante_eliminado_acceso')
        .upsert(hashes.map((hash) => ({ email_hash: hash, deleted_at: new Date().toISOString() })));
      if (markerError) console.warn('[Delete Restaurant] No se pudo guardar marcador de acceso eliminado:', markerError.message);
    }

    for (const user of usuarios) {
      if (!user.auth_id) continue;
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
      if (authError) console.warn('[Delete Restaurant] No se pudo eliminar Auth user:', authError.message);
    }

    if (pedidoIds.length > 0) {
      const { data: detalles, error: detallesError } = await supabaseAdmin
        .from('detalle_pedido')
        .select('id')
        .in('id_pedido', pedidoIds);
      if (detallesError) throw detallesError;
      const detalleIds = (detalles || []).map((d) => d.id);
      await deleteByIds('detalle_pedido_agregado', 'id_detalle_pedido', detalleIds);
      await deleteByIds('detalle_pedido', 'id_pedido', pedidoIds);
    }

    await deleteByRestaurant('pedido', id);
    await deleteByIds('producto_grupo', 'id_producto', productoIds);
    await deleteByIds('agregado', 'id_grupo', grupoIds);
    await deleteByRestaurant('grupo_agregados', id);
    await deleteByRestaurant('producto', id);
    await deleteByRestaurant('categoria', id);
    await deleteByRestaurant('promocion', id);
    await deleteByRestaurant('web_combo', id);
    await deleteByRestaurant('web_oferta', id);
    await deleteByRestaurant('web_config', id);
    await deleteByRestaurant('restaurante_suscripcion', id);
    await deleteByRestaurant('mesa', id);
    await deleteByIds('usuario', 'id', usuarios.map((u) => u.id));

    const imageUrls = [
      restaurante.logo_url,
      restaurante.hero_banner_url,
      ...productos.map((p) => p.imagen_url),
      ...(categoriasRes.data || []).map((c) => c.imagen_url),
      ...(promocionesRes.data || []).map((p) => p.imagen_url),
      ...(webCombosRes.data || []).map((c) => c.imagen_url),
      ...(webOfertasRes.data || []).map((o) => o.imagen_url),
    ];
    const comprobanteUrls = pedidos.map((p) => p.comprobante_url);

    const { error: deleteRestError } = await supabaseAdmin
      .from('restaurante')
      .delete()
      .eq('id', id);
    if (deleteRestError) throw deleteRestError;

    await Promise.all([
      removeStorageObjects(imageUrls, 'imagenes'),
      removeStorageObjects(comprobanteUrls, 'comprobantes'),
    ]);

    res.json({ data: { message: `Restaurante ${restaurante.nombre} eliminado completamente.`, login_message: DELETED_RESTAURANT_MESSAGE } });
  } catch (err) {
    console.error('[Delete Restaurant Error]', err);
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
