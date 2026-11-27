import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read Supabase credentials from Vite or Next-style environment variables
const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20
);

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.info("⚡ Supabase Realtime connected to:", supabaseUrl);
  } catch (err) {
    console.warn("Could not initialize Supabase client:", err);
  }
} else {
  console.info(
    "ℹ️ Supabase credentials not found in env. Running in resilient local reactive store mode with dual Web BroadcastChannel."
  );
}

export const supabase = supabaseClient;
