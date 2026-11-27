import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      status: "degraded",
      databaseConnected: false,
      realtimeEnabled: false,
      error: "Supabase environment variables (VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL) not found in Vercel",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { count: tablesCount, error: tablesErr } = await supabase
      .from("restaurant_tables")
      .select("*", { count: "exact", head: true });

    const { count: ordersCount, error: ordersErr } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (tablesErr) {
      return res.status(200).json({
        status: "error",
        databaseConnected: false,
        supabaseConfigured: true,
        supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, "https://$1***$2") : "missing",
        error: tablesErr.message || JSON.stringify(tablesErr),
        errorCode: tablesErr.code,
        errorDetails: tablesErr.details,
        errorHint: tablesErr.hint,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: "healthy",
      databaseConnected: true,
      realtimeEnabled: true,
      tablesCount: tablesCount ?? 0,
      ordersCount: ordersCount ?? 0,
      supabaseUrl: supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, "https://$1***$2"),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      databaseConnected: false,
      error: err?.message || "Unknown error",
      stack: err?.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
