/* ═══════════════════════════════════════════════════════════
   Supabase Client — Para Realtime en la app del mesero
   ═══════════════════════════════════════════════════════════ */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bkcaoijyzunfkntcjzcd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrY2FvaWp5enVuZmtudGNqemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIwOTEsImV4cCI6MjA5MTE0ODA5MX0.gVmIIztTOJXzngX0C3ex8FGeZk4BPykyuKaQwM__13I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
