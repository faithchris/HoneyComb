import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Same as VITE_SUPABASE_URL — use for Edge Function URLs (must match deployed project). */
export const SUPABASE_URL = supabaseUrl ?? "";
/** Same as VITE_SUPABASE_ANON_KEY (or publishable key) — used for direct function fetches. */
export const SUPABASE_ANON_KEY = supabaseAnonKey ?? "";

