/**
 * Script de corrección: Sincronizar estado de pedidos existentes
 * Arregla la inconsistencia donde pedidos están PAGADOS pero con estado PENDIENTE.
 * 
 * Ejecútalo una sola vez: node src/scripts/fix-estado-pedidos.js
 */
require('dotenv').config();
const supabase = require('../config/supabase');

const ID_RESTAURANTE = 'a0000000-0000-0000-0000-000000000001';

async function fixEstadoPedidos() {
  console.log('🔧 Corrigiendo inconsistencias de estado en pedidos...\n');

  // 1. Obtener todos los pedidos con sus detalles
  const { data: pedidos, error } = await supabase
    .from('pedido')
    .select(`
      id, estado, estado_pago, metodo_pago, total,
      detalle_pedido(id, estado)
    `)
    .eq('id_restaurante', ID_RESTAURANTE)
    .is('deleted_at', null);

  if (error) {
    console.error('❌ Error obteniendo pedidos:', error.message);
    process.exit(1);
  }

  console.log(`📋 ${pedidos.length} pedidos encontrados\n`);

  let fixed = 0;

  for (const pedido of pedidos) {
    const detalles = pedido.detalle_pedido || [];
    const estados = detalles.map(d => d.estado);
    
    // Determinar el estado correcto basado en los detalles
    let estadoCorrecto;
    if (estados.every(e => e === 'ENTREGADO' || e === 'CANCELADO')) {
      estadoCorrecto = 'ENTREGADO';
    } else if (estados.some(e => e === 'LISTO')) {
      estadoCorrecto = 'LISTO';
    } else if (estados.some(e => e === 'EN_PREPARACION')) {
      estadoCorrecto = 'EN_PREPARACION';
    } else {
      estadoCorrecto = 'PENDIENTE';
    }

    // Si el pedido está PAGADO, también debe estar en ENTREGADO
    if (pedido.estado_pago === 'PAGADO') {
      estadoCorrecto = 'ENTREGADO';
      
      // Marcar todos los detalles como ENTREGADO si el pedido ya está pagado
      for (const det of detalles) {
        if (det.estado !== 'ENTREGADO' && det.estado !== 'CANCELADO') {
          await supabase
            .from('detalle_pedido')
            .update({ estado: 'ENTREGADO' })
            .eq('id', det.id);
          console.log(`  └─ Detalle ${det.id.slice(0,8)} → ENTREGADO`);
        }
      }
    }

    // Actualizar el pedido si el estado es diferente
    if (pedido.estado !== estadoCorrecto) {
      console.log(`📝 Pedido ${pedido.id.slice(0,8)}:  ${pedido.estado} → ${estadoCorrecto}  (pago: ${pedido.estado_pago})`);
      
      await supabase
        .from('pedido')
        .update({ estado: estadoCorrecto })
        .eq('id', pedido.id);
      
      fixed++;
    }
  }

  console.log(`\n✅ Corrección completada: ${fixed} pedidos actualizados de ${pedidos.length} totales.`);
  process.exit(0);
}

fixEstadoPedidos();
