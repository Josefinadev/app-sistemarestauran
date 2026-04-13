/**
 * Cliente Supabase Admin (Service Role)
 * Tiene permisos elevados: crear usuarios, bypass RLS, etc.
 * NUNCA exponer esta key en el frontend.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabaseAdmin;
