import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./env";

// Route handlers/server actions only. Uses the service role key, so never
// import this from client components.
//
// Tables live in the `propertyintel` schema inside the shared SureDiagnostics
// Supabase project (same convention as JMF Canteen's `jmf` schema), so every
// query must target it explicitly.
export function getServerSupabase() {
  if (!isSupabaseConfigured || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    db: { schema: "propertyintel" },
  });
}
