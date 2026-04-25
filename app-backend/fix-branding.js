const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixBranding() {
  console.log('🚀 Iniciando corrección de Branding en la Base de Datos...');

  try {
    console.log('Checking columns in table "restaurante"...');
    // Intentamos seleccionar las columnas para ver si existen
    const { data: test, error: testError } = await supabase.from('restaurante').select('color_primario').limit(1);

    if (testError) {
        console.log('⚠️ Error al leer columnas:', testError.message);
        console.log('⚠️ Es MUY probable que las columnas "color_primario" y "color_secundario" NO existan en la tabla "restaurante".');
        console.log('Acción necesaria: Copia el contenido de "app-backend/supabase/migrations/005_branding_fixes.sql" y pégalo en el SQL Editor de tu Dashboard de Supabase.');
        return;
    }

    console.log('✅ Columnas encontradas. Procediendo a actualizar datos...');

    // 2. Si las columnas existen, asegurar colores por defecto
    await supabase.from('restaurante').update({ color_primario: '#C5A059' }).is('color_primario', null);
    await supabase.from('restaurante').update({ color_secundario: '#E2725B' }).is('color_secundario', null);

    // 3. Específicamente para el-mijano
    await supabase.from('restaurante').update({ 
        color_primario: '#C5A059', 
        color_secundario: '#E2725B' 
    }).eq('slug', 'el-mijano');

    console.log('✅ Corrección de datos completada.');
    console.log('Importante: Si el Admin aún no puede guardar, asegúrate de haber ejecutado la política RLS del archivo migration 005.');

  } catch (err) {
    console.error('❌ Error fatal:', err);
  }
}

fixBranding();
