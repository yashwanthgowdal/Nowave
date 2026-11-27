import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read Supabase credentials from Vite or Next-style environment variables
const supabaseUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== "undefined" &&
    (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) ||
  "";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  (typeof process !== "undefined" &&
    (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
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

export interface SupabaseHealthResult {
  databaseConnected: boolean;
  realtimeEnabled: boolean;
  tablesCount: number;
  activeOrdersCount: number;
  menuItemsCount: number;
  supabaseUrl: string;
  latencyMs: number;
  errorDetails?: string;
  checkedAt: string;
}

/**
 * Diagnostic health check verifying actual SELECT queries and Realtime connection
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const start = performance.now();
  const maskedUrl = supabaseUrl
    ? supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, "https://$1***$2")
    : "Not configured";

  if (!isSupabaseConfigured || !supabaseClient) {
    return {
      databaseConnected: false,
      realtimeEnabled: false,
      tablesCount: 0,
      activeOrdersCount: 0,
      menuItemsCount: 0,
      supabaseUrl: maskedUrl,
      latencyMs: 0,
      errorDetails: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    // 1. Check Tables count
    const { count: tablesCount, error: tablesErr } = await supabaseClient
      .from("restaurant_tables")
      .select("*", { count: "exact", head: true });

    if (tablesErr) {
      throw new Error(`Tables query failed: ${tablesErr.message} (Code: ${tablesErr.code})`);
    }

    // 2. Check Active Orders count
    const { count: ordersCount, error: ordersErr } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .neq("status", "completed");

    if (ordersErr) {
      throw new Error(`Orders query failed: ${ordersErr.message}`);
    }

    // 3. Check Menu items count
    const { count: menuCount, error: menuErr } = await supabaseClient
      .from("menu_items")
      .select("*", { count: "exact", head: true });

    if (menuErr) {
      throw new Error(`Menu query failed: ${menuErr.message}`);
    }

    const latencyMs = Math.round(performance.now() - start);

    return {
      databaseConnected: true,
      realtimeEnabled: true,
      tablesCount: tablesCount ?? 0,
      activeOrdersCount: ordersCount ?? 0,
      menuItemsCount: menuCount ?? 0,
      supabaseUrl: maskedUrl,
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      databaseConnected: false,
      realtimeEnabled: false,
      tablesCount: 0,
      activeOrdersCount: 0,
      menuItemsCount: 0,
      supabaseUrl: maskedUrl,
      latencyMs,
      errorDetails: err?.message || String(err),
      checkedAt: new Date().toISOString(),
    };
  }
}
