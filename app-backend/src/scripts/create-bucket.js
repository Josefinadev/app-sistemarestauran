/**
 * Script para crear el bucket "imagenes" en Supabase Storage.
 * Ejecútalo una sola vez: node src/scripts/create-bucket.js
 */
require('dotenv').config();
const supabase = require('../config/supabase');

async function createBucket() {
  console.log('Creando bucket "imagenes" en Supabase Storage...\n');

  const { data, error } = await supabase
    .storage
    .createBucket('imagenes', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ El bucket "imagenes" ya existe. Nada que hacer.');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ Bucket "imagenes" creado exitosamente:', data);
  }

  process.exit(0);
}

createBucket();
