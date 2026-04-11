import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente Supabase para uso en el browser (componentes client) */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/** Crea un cliente nuevo (útil para server components o API routes) */
export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
