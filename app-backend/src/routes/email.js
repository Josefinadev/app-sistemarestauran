const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const supabaseAdmin = require('../config/supabase-admin');

// Configuración del transporter de Nodemailer
// Se asume que las credenciales vendrán del .env o se pasan directamente
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tucorreo@gmail.com',
    pass: process.env.EMAIL_PASS || 'trlv lskb mjdj dhqx',
  },
});

/**
 * POST /api/email/promociones
 * Enviar un correo promocional a una lista de clientes (por sus IDs)
 */
router.post('/promociones', authenticate, async (req, res) => {
  try {
    // Validar que el usuario que envía es admin o propietario
    if (!req.isSuperAdmin && !['admin', 'propietario'].includes(req.user.rol)) {
      return res.status(403).json({ error: true, message: 'Solo admin/propietario puede enviar promociones.' });
    }

    const { clientesIds, asunto, mensajeHTML } = req.body;

    if (!clientesIds || !Array.isArray(clientesIds) || clientesIds.length === 0) {
      return res.status(400).json({ error: true, message: 'Debes seleccionar al menos un cliente.' });
    }

    if (!asunto || !mensajeHTML) {
      return res.status(400).json({ error: true, message: 'El asunto y el mensaje son obligatorios.' });
    }

    // 1. Obtener los emails de los clientes seleccionados desde Supabase
    // Solo permitimos obtener usuarios del mismo restaurante
    const { data: clientes, error: fetchError } = await supabaseAdmin
      .from('usuario')
      .select('email, nombre, id_restaurante')
      .in('id', clientesIds)
      .eq('rol', 'cliente');

    if (fetchError) throw fetchError;

    // Filtrar los que pertenecen al restaurante actual (por seguridad)
    const clientesFiltrados = req.isSuperAdmin
      ? clientes
      : clientes.filter(c => c.id_restaurante === req.user.id_restaurante);

    if (clientesFiltrados.length === 0) {
      return res.status(404).json({ error: true, message: 'No se encontraron clientes válidos para enviar el correo.' });
    }

    // Extraer solo los emails que no sean nulos o vacíos
    const emailsDestino = clientesFiltrados
      .map(c => c.email)
      .filter(email => email && email.trim() !== '');

    if (emailsDestino.length === 0) {
      return res.status(400).json({ error: true, message: 'Los clientes seleccionados no tienen un correo electrónico registrado.' });
    }

    // 2. Enviar el correo usando Nodemailer (BCC para proteger la privacidad)
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tucorreo@gmail.com',
      bcc: emailsDestino, // Utilizamos CCO (BCC) para no revelar los emails entre clientes
      subject: asunto,
      html: mensajeHTML,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Correo enviado: ', info.messageId);

    res.json({
      error: false,
      message: `Promoción enviada exitosamente a ${emailsDestino.length} clientes.`,
    });
  } catch (err) {
    console.error('[Email Error]:', err);
    res.status(500).json({ error: true, message: 'Error al enviar el correo promocional.', detalle: err.message });
  }
});

module.exports = router;
