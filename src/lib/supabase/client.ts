import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

// PropertyIntel's tables live in their own `propertyintel` schema inside the
// shared SureDiagnostics Supabase project (same convention as JMF Canteen's
// `jmf` schema), so every query must target it explicitly.
export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
    db: { schema: "propertyintel" },
  });
}
