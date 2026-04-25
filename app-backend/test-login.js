const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@elmijano.pe',
    password: 'admin123',
  });
  console.log("Error:", error);
  console.log("Data:", data?.user ? "User logged in: " + data.user.id : "No user");
}
test();
