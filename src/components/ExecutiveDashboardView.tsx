"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  UtensilsCrossed,
  Star,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  Activity,
  Sparkles,
} from "lucide-react";
import { useRestaurantStore } from "@/lib/useRestaurantStore";
import { formatPrice } from "@/lib/utils";

interface ExecutiveDashboardViewProps {
  onNavigateTab: (tab: "kds" | "floor" | "menu" | "qr") => void;
}

export function ExecutiveDashboardView({ onNavigateTab }: ExecutiveDashboardViewProps) {
  const { metrics, tables, activeServiceRequests, orders } = useRestaurantStore();

  return (
    <div className="space-y-6">
      {/* ── Top Executive KPI Ticker (Video: "BEST PART - EK SCREEN PAR") ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Tables Occupied */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Tables Occupied</span>
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-white">
              {metrics.occupiedTables}/{metrics.totalTables}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {Math.round((metrics.occupiedTables / metrics.totalTables) * 100)}% capacity
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">All table systems operational</p>
        </div>

        {/* Metric 2: Live Orders Count */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Tonight Orders</span>
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-amber">
              {metrics.totalOrdersCount}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">orders placed</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Average 30 sec order transit</p>
        </div>

        {/* Metric 3: Real-Time Sales */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gross Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-emerald-400">
              {formatPrice(metrics.totalSales)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Real-time table-side payments</p>
        </div>

        {/* Metric 4: Customer Satisfaction Rating */}
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Guest Rating</span>
            <Star className="w-4 h-4 text-amber fill-amber" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-white">
              {metrics.avgRating} ★
            </span>
            <span className="text-xs text-amber font-semibold">98% positive</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Based on 1-tap dining reviews</p>
        </div>
      </div>

      {/* ── Central Floor-to-Kitchen Radial Map (Video Blueprint) ── */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber font-bold">
              Autonomous Operations Grid
            </span>
            <h3 className="font-serif text-xl font-bold text-white mt-0.5">
              Restaurant Real-Time Topology
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab("kds")}
              className="text-xs font-bold text-amber hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Open KDS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("floor")}
              className="text-xs font-bold text-emerald-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Open Floor Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Central Kitchen Hub */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="px-8 py-3 rounded-2xl bg-zinc-900 border-2 border-amber/40 shadow-xl shadow-amber/10 flex items-center gap-3 relative z-10">
            <Flame className="w-5 h-5 text-amber animate-pulse" />
            <span className="font-serif text-sm font-extrabold text-white tracking-widest uppercase">
              Central Kitchen
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              3 Stations Active
            </span>
          </div>

          {/* Connected Tables Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full mt-10">
            {tables.map((t) => {
              const activeReq = activeServiceRequests.find((r) => r.tableNumber === t.tableNumber);
              const isHelp = Boolean(activeReq) || t.status === "help";

              return (
                <div
                  key={t.tableNumber}
                  onClick={() => onNavigateTab("floor")}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-all ${
                    isHelp
                      ? "bg-red-950/40 border-red-500 ring-2 ring-red-500/30 text-white animate-pulse"
                      : t.status === "bill"
                      ? "bg-amber/10 border-amber/50 text-white"
                      : t.status === "eating"
                      ? "bg-emerald-950/20 border-emerald-500/40 text-white"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black font-mono text-amber mb-1.5">
                    T{t.tableNumber}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isHelp ? "HELP!" : t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
