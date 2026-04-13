/**
 * Script para crear los usuarios iniciales en Supabase Auth
 * y vincularlos con la tabla usuario existente.
 * 
 * Ejecutar UNA SOLA VEZ después de correr la migración 004_auth_integration.sql
 * 
 * Uso: npm run seed-auth
 */
const supabaseAdmin = require('../config/supabase-admin');

const users = [
  {
    email: 'admin@elmijano.pe',
    password: 'admin123',
    usuarioId: 'e0000000-0000-0000-0000-000000000001',
    label: 'Administrador',
  },
  {
    email: 'cocina@elmijano.pe',
    password: 'cocina123',
    usuarioId: 'e0000000-0000-0000-0000-000000000002',
    label: 'Chef Carlos (Cocina)',
  },
  {
    email: 'mesero@elmijano.pe',
    password: 'mesero123',
    usuarioId: 'e0000000-0000-0000-0000-000000000003',
    label: 'Mesero Pedro',
  },
  {
    email: 'caja@elmijano.pe',
    password: 'caja123',
    usuarioId: 'e0000000-0000-0000-0000-000000000004',
    label: 'Cajera María',
  },
];

async function seedAuthUsers() {
  console.log('\n🔐 Creando usuarios en Supabase Auth...\n');

  for (const u of users) {
    process.stdout.write(`  → ${u.label} (${u.email})... `);

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (authError) {
      console.log(`❌ ${authError.message}`);
      
      // Si ya existe, intentar buscar su ID para vincular
      if (authError.message?.includes('already') || authError.status === 422) {
        console.log('    (El usuario ya existe en Auth, intentando vincular...)');
        
        // Listar usuarios para encontrar el ID
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(usr => usr.email === u.email);
        
        if (existingUser) {
          const { error: updateError } = await supabaseAdmin
            .from('usuario')
            .update({ auth_id: existingUser.id })
            .eq('id', u.usuarioId);

          if (!updateError) {
            console.log(`    ✅ Vinculado (auth_id: ${existingUser.id})`);
          } else {
            console.log(`    ❌ Error vinculando: ${updateError.message}`);
          }
        }
      }
      continue;
    }

    // 2. Vincular con tabla usuario
    const { error: updateError } = await supabaseAdmin
      .from('usuario')
      .update({ auth_id: authData.user.id })
      .eq('id', u.usuarioId);

    if (updateError) {
      console.log(`❌ Error vinculando: ${updateError.message}`);
    } else {
      console.log(`✅ (auth_id: ${authData.user.id})`);
    }
  }

  console.log('\n════════════════════════════════════════════');
  console.log('  🍷 Credenciales de acceso al sistema:');
  console.log('════════════════════════════════════════════');
  users.forEach(u => {
    console.log(`  📧 ${u.email.padEnd(22)} 🔑 ${u.password}`);
  });
  console.log('════════════════════════════════════════════\n');
}

seedAuthUsers().catch(console.error);
