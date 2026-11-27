"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Users,
  Utensils,
  Clock,
  Sparkles,
  ChefHat,
  CreditCard,
  Ban,
} from "lucide-react";
import { TableSession } from "@/lib/types";
import { useRestaurantStore } from "@/lib/useRestaurantStore";

export function StaffFloorMap() {
  const { tables, updateTableStatus, orders } = useRestaurantStore();

  return (
    <div className="space-y-6">
      {/* Floor Map Header */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-serif font-black tracking-wider text-white uppercase">
              Dining Room Floor Grid
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical table states: Lamp-driven dining presence • Zero waiter interruption
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-zinc-500" /> Browsing
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Cooking
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Eating
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber">
            <span className="w-2 h-2 rounded-full bg-amber" /> Paid
          </span>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tables.map((table) => {
          const activeOrder = orders.find(
            (o) => o.tableNumber === table.tableNumber && o.status !== "completed"
          );

          return (
            <motion.div
              key={table.tableNumber}
              layout
              className={`relative border rounded-3xl p-5 flex flex-col justify-between min-h-[170px] transition-all bg-[#151518] ${
                table.status === "cooking"
                  ? "border-blue-500/50 bg-blue-950/10 shadow-lg shadow-blue-950/20"
                  : table.status === "eating"
                  ? "border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-950/10"
                  : table.status === "paid"
                  ? "border-amber/50 bg-amber/5"
                  : "border-zinc-800"
              }`}
            >
              {/* Table Top Header */}
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-lg font-black border ${
                        table.status === "cooking"
                          ? "bg-blue-950 text-blue-400 border-blue-500/40"
                          : table.status === "eating"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                          : table.status === "paid"
                          ? "bg-amber/20 text-amber border-amber/40"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      T{table.tableNumber}
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                        Table {table.tableNumber}
                      </span>
                      <p className="text-xs font-semibold text-zinc-300">
                        {table.guestCount || 2} Diners
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      table.status === "cooking"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : table.status === "eating"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : table.status === "paid"
                        ? "bg-amber text-obsidian font-black"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {table.status}
                  </span>

                  {activeOrder && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      {activeOrder.orderNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Table Action Footers */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500">
                  {table.status === "paid" ? "Settle / Reset" : "Physical Lamp Table"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus =
                        table.status === "browsing"
                          ? "eating"
                          : table.status === "eating"
                          ? "paid"
                          : "browsing";
                      updateTableStatus(table.tableNumber, nextStatus);
                    }}
                    className="text-[11px] font-bold text-amber hover:text-white transition-colors"
                  >
                    {table.status === "paid" ? "Clear Table" : "Toggle State"}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
