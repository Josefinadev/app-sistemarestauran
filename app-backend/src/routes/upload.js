const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const path = require('path');
const crypto = require('crypto');

// ── Configurar multer (memoria, máx 5MB) ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
    }
  },
});

// ── POST /api/upload — Subir imagen a Supabase Storage ──
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const folder = req.body.folder || 'web';
    const uniqueName = `${folder}/${crypto.randomUUID()}${ext}`;

    // Subir a Supabase Storage (bucket: "imagenes")
    const { data, error } = await supabase
      .storage
      .from('imagenes')
      .upload(uniqueName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Error Supabase Storage:', error.message);
      return res.status(500).json({ error: `Error al subir: ${error.message}` });
    }

    // Obtener URL pública
    const { data: urlData } = supabase
      .storage
      .from('imagenes')
      .getPublicUrl(uniqueName);

    res.json({
      url: urlData.publicUrl,
      path: uniqueName,
    });
  } catch (err) {
    console.error('Error en upload:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
