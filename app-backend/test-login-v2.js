const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  const email = 'admin.saas.mijano@mijano.com';
  const password = 'password123';
  console.log(`Intentando login para ${email} con ${password}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error("Error:", error.message, "Status:", error.status);
  } else {
    console.log("Success! User ID:", data.user.id);
  }
}
test();
