const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabase-admin');
const router = express.Router();

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
      .single();

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

module.exports = router;
