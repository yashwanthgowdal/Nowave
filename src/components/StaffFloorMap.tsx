"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Clock,
  Users,
  Utensils,
  Receipt,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { TableSession, ServiceRequest } from "@/lib/types";
import { useRestaurantStore } from "@/lib/useRestaurantStore";

export function StaffFloorMap() {
  const {
    tables,
    activeServiceRequests,
    acknowledgeServiceRequest,
    resolveServiceRequest,
    updateTableStatus,
  } = useRestaurantStore();

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Floor Map Header */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-serif font-black tracking-wider text-white uppercase">
              Live Dining Floor Map
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time table occupancy, customer order status & call waiter SLA response timer
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-zinc-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Eating
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber">
            <span className="w-2 h-2 rounded-full bg-amber" /> Bill
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Needs Help
          </span>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tables.map((table) => {
          const activeRequest = activeServiceRequests.find(
            (r) => r.tableNumber === table.tableNumber
          );
          const isCallingHelp = Boolean(activeRequest) || table.status === "help";

          let callSeconds = 0;
          if (activeRequest) {
            callSeconds = Math.max(1, Math.floor((currentTime - activeRequest.createdAt) / 1000));
          }

          return (
            <motion.div
              key={table.tableNumber}
              layout
              className={`relative border rounded-3xl p-5 flex flex-col justify-between min-h-[170px] transition-all bg-[#151518] ${
                isCallingHelp
                  ? "border-red-500 ring-2 ring-red-500/40 shadow-2xl shadow-red-950/40 bg-gradient-to-b from-red-950/20 to-[#151518]"
                  : table.status === "bill"
                  ? "border-amber/60 bg-amber/5"
                  : table.status === "eating"
                  ? "border-emerald-500/30"
                  : "border-zinc-800"
              }`}
            >
              {/* Alert Glow Animation */}
              {isCallingHelp && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-mono font-bold animate-pulse">
                  <Bell className="w-3.5 h-3.5" />
                  <span>{callSeconds} SEC AGO</span>
                </div>
              )}

              {/* Table Top Header */}
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-lg font-black ${
                        isCallingHelp
                          ? "bg-red-500 text-white animate-bounce"
                          : "bg-zinc-800 text-amber border border-zinc-700"
                      }`}
                    >
                      T{table.tableNumber}
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                        Table {table.tableNumber}
                      </span>
                      <p className="text-xs font-semibold text-zinc-300">
                        {table.guestCount || 2} Guests
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      isCallingHelp
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : table.status === "bill"
                        ? "bg-amber text-obsidian"
                        : table.status === "eating"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : table.status === "cooking"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isCallingHelp
                      ? `Help: ${activeRequest?.type.toUpperCase() || "CALL"}`
                      : table.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Staff */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                {isCallingHelp && activeRequest ? (
                  <button
                    type="button"
                    onClick={() => resolveServiceRequest(activeRequest.id)}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-lg shadow-red-600/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve ({activeRequest.type})</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      {table.status === "available" ? "Ready for diners" : "Active session"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateTableStatus(
                          table.tableNumber,
                          table.status === "available" ? "eating" : "available"
                        )
                      }
                      className="text-[11px] underline hover:text-white"
                    >
                      {table.status === "available" ? "Seat Table" : "Clear Table"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
