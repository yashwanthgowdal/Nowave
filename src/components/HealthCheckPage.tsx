import { useEffect, useState } from "react";
import { checkSupabaseHealth, SupabaseHealthResult } from "@/lib/supabase";

export function HealthCheckPage() {
  const [health, setHealth] = useState<SupabaseHealthResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupabaseHealth().then((res) => {
      setHealth(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono p-6 text-sm flex items-center justify-center">
        Running diagnostic checks on Supabase PostgreSQL & Realtime WebSockets...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-6 text-sm">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-xl font-bold border-b border-green-800 pb-2">
          NoWave Ecosystem API Diagnostic (/api/health)
        </h1>
        <pre className="p-4 bg-zinc-950 border border-green-900 rounded-xl overflow-x-auto text-xs leading-relaxed">
          {JSON.stringify(health, null, 2)}
        </pre>
        <p className="text-xs text-zinc-500">
          Status: {health?.databaseConnected ? "🟢 Fully Operational" : "🔴 Disconnected / Missing Keys"}
        </p>
      </div>
    </div>
  );
}
