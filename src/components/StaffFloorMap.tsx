"use client";

import { motion } from "framer-motion";
import {
  UserCheck,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
  Clock,
  Sparkles,
} from "lucide-react";
import { TableSession } from "@/lib/types";
import { useRestaurantStore } from "@/lib/useRestaurantStore";

export function StaffFloorMap() {
  const { tables, orders, waiters, transferTable, resetTable } = useRestaurantStore();

  const handleReset = (tableNumber: string) => {
    if (confirm(`Reset Table ${tableNumber} to available? This clears the active session and assigns a fresh OTP.`)) {
      resetTable(tableNumber);
    }
  };

  const handleTransfer = (tableNumber: string, newWaiterId: string) => {
    const target = waiters.find((w) => w.id === newWaiterId);
    if (!target) return;
    transferTable(tableNumber, target.id, target.name);
  };

  return (
    <div className="space-y-6">
      {/* Floor Map Header */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-serif font-black tracking-wider text-white uppercase">
              Dining Room Floor Grid ({tables.length} Tables)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time table states • Waiter assignment • Anti-fake OTP verification
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-zinc-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Browsing
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber/20 border border-amber/40 text-amber animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber animate-ping" /> Awaiting OTP
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Cooking
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Eating
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber/10 border border-amber/30 text-amber">
            <span className="w-2 h-2 rounded-full bg-amber" /> Paid
          </span>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {tables.map((table) => {
          const activeOrder = orders.find(
            (o) => o.tableNumber === table.tableNumber && o.status !== "completed"
          );

          const isAwaitingOtp =
            table.status === "awaiting_verification" ||
            activeOrder?.status === "awaiting_verification";

          const cardStyle = isAwaitingOtp
            ? "border-amber/60 bg-gradient-to-b from-[#251e15] to-[#151518] shadow-lg shadow-amber/15 animate-pulse"
            : table.status === "browsing"
            ? "border-blue-500/40 bg-blue-950/10"
            : table.status === "ordered" || table.status === "cooking"
            ? "border-purple-500/40 bg-purple-950/10 shadow-lg shadow-purple-950/20"
            : table.status === "eating"
            ? "border-emerald-500/40 bg-emerald-950/10"
            : table.status === "paid"
            ? "border-amber/40 bg-amber/5"
            : "border-zinc-800 bg-[#151518]";

          return (
            <motion.div
              key={table.tableNumber}
              layout
              className={`relative border rounded-3xl p-4 flex flex-col justify-between min-h-[220px] transition-all ${cardStyle}`}
            >
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-serif text-sm font-black text-amber">
                      T{table.tableNumber}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {table.tableLabel || `Table ${table.tableNumber}`}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {table.guestCount || 2} Diners
                      </div>
                    </div>
                  </div>

                  {activeOrder && (
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber">
                        ₹{activeOrder.totalAmount}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        {activeOrder.orderNumber}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      isAwaitingOtp
                        ? "bg-amber text-black font-extrabold"
                        : table.status === "browsing"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : table.status === "cooking" || table.status === "ordered"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : table.status === "eating"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : table.status === "paid"
                        ? "bg-amber/20 text-amber border border-amber/40"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isAwaitingOtp ? "Awaiting OTP" : table.status === "browsing" ? "Browsing (QR Scanned)" : table.status}
                  </span>

                  {table.verificationOtp && (
                    <span className="text-[10px] font-mono text-zinc-500" title="Active Session OTP">
                      OTP: {table.verificationOtp}
                    </span>
                  )}
                </div>

                {/* Handled by Waiter Display */}
                <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-400">Handled by:</span>
                  <span className="font-semibold text-zinc-200">
                    {table.assignedWaiterName ? (
                      <span className="text-amber flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {table.assignedWaiterName}
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Unassigned</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Table Action Footers: Transfer Waiter & 1-Click Reset */}
              <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-[10px]">
                    <ArrowRightLeft className="w-3 h-3 text-zinc-400" />
                    <select
                      className="bg-transparent text-zinc-300 outline-none w-full text-[10px]"
                      value={table.assignedWaiterId || ""}
                      onChange={(e) => handleTransfer(table.tableNumber, e.target.value)}
                    >
                      <option value="" disabled>
                        Assign Waiter...
                      </option>
                      {waiters.map((w) => (
                        <option key={w.id} value={w.id} className="bg-[#181615]">
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReset(table.tableNumber)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="1-Click Reset Table (Generates fresh OTP)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
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
