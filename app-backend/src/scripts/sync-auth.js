const supabaseAdmin = require('../config/supabase-admin');

async function sync() {
  const { data: dbUsers } = await supabaseAdmin.from('usuario').select('id, email');
  console.log('Sincronizando usuarios...');
  
  for (const user of dbUsers) {
    if (!user.email) continue;
    console.log(`- Procesando: ${user.email}`);
    
    // Crear en Auth con password genérico
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: 'password123',
      email_confirm: true
    });
    
    let authId = authData?.user?.id;
    
    if (authError) {
      if (authError.message.includes('already')) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list.users.find(u => u.email === user.email);
        authId = existing?.id;
      } else {
        console.error(`  Error creating ${user.email}: ${authError.message}`);
        continue;
      }
    }
    
    if (authId) {
      await supabaseAdmin.from('usuario').update({ auth_id: authId }).eq('id', user.id);
      console.log(`  ✅ OK: ${user.email} -> ${authId}`);
    }
  }
}
sync();
