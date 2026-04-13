/**
 * Agrega el campo requiere_preparacion a productos.
 * - Bebidas empaquetadas (Inca Kola) → false (va directo a mesero)
 * - Bebidas preparadas (Chicha Morada, Pisco Sour) → true (pasa por cocina)
 * - Platos → true (siempre pasan por cocina)
 * 
 * Ejecutar: node src/scripts/add-requiere-preparacion.js
 */
require('dotenv').config();
const supabase = require('../config/supabase');

async function migrate() {
  console.log('🔧 Agregando campo requiere_preparacion a productos...\n');

  // 1. Agregar columna (si no existe)
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE producto ADD COLUMN IF NOT EXISTS requiere_preparacion BOOLEAN DEFAULT true;`
  }).catch(() => ({ error: null }));

  // Si RPC no funciona, hacer el ALTER directamente via REST
  // Intentar con SQL directo
  const { error: sqlError } = await supabase
    .from('producto')
    .select('requiere_preparacion')
    .limit(1);

  if (sqlError && sqlError.message.includes('requiere_preparacion')) {
    console.log('⚠️  La columna no existe aún. Debes ejecutar este SQL en Supabase Dashboard:\n');
    console.log('ALTER TABLE producto ADD COLUMN requiere_preparacion BOOLEAN DEFAULT true;\n');
    console.log('Luego vuelve a ejecutar este script.\n');
    process.exit(1);
  }

  console.log('✅ Columna requiere_preparacion existe\n');

  // 2. Bebidas que NO requieren preparación (van directo al mesero)
  const bebidasDirectas = [
    'b0000000-0000-0000-0000-000000000008', // Inca Kola
  ];

  // 3. Bebidas que SÍ requieren preparación (pasan por cocina)
  const bebidasCocina = [
    'b0000000-0000-0000-0000-000000000006', // Chicha Morada
    'b0000000-0000-0000-0000-000000000007', // Pisco Sour
  ];

  // Marcar bebidas directas como requiere_preparacion = false
  for (const id of bebidasDirectas) {
    const { error } = await supabase
      .from('producto')
      .update({ requiere_preparacion: false })
      .eq('id', id);
    
    if (error) {
      console.error(`❌ Error actualizando ${id}:`, error.message);
    } else {
      console.log(`📦 ${id} → requiere_preparacion = false (directo a mesero)`);
    }
  }

  // Marcar bebidas de cocina como requiere_preparacion = true (ya es el default)
  for (const id of bebidasCocina) {
    const { error } = await supabase
      .from('producto')
      .update({ requiere_preparacion: true })
      .eq('id', id);
    
    if (error) {
      console.error(`❌ Error actualizando ${id}:`, error.message);
    } else {
      console.log(`🍹 ${id} → requiere_preparacion = true (pasa por cocina)`);
    }
  }

  // Verificar resultado
  const { data: productos } = await supabase
    .from('producto')
    .select('nombre, es_bebida, requiere_preparacion')
    .eq('id_restaurante', 'a0000000-0000-0000-0000-000000000001')
    .order('nombre');

  console.log('\n📋 Estado final de productos:');
  console.log('─'.repeat(60));
  for (const p of productos || []) {
    const flujo = p.requiere_preparacion ? '🔥 Cocina → Mesero' : '⚡ Directo a Mesero';
    console.log(`  ${p.nombre.padEnd(25)} ${p.es_bebida ? '🥤' : '🍽️'}  ${flujo}`);
  }

  console.log('\n✅ Configuración completada.');
  process.exit(0);
}

migrate();
