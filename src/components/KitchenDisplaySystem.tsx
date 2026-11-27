"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Soup,
  Coffee,
  CheckCircle2,
  Clock,
  Timer,
  AlertCircle,
  Volume2,
  Sparkles,
  Layers,
} from "lucide-react";
import { Order, KitchenStation, OrderItemRecord } from "@/lib/types";
import { RestaurantStore } from "@/lib/RestaurantStore";
import { useRestaurantStore } from "@/lib/useRestaurantStore";

export function KitchenDisplaySystem() {
  const { orders, updateOrderStatus, updateItemStationStatus } = useRestaurantStore();
  const [selectedStation, setSelectedStation] = useState<KitchenStation | "all">("all");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter active cooking / pending orders (ONLY verified orders reach KDS; unverified orders are excluded)
  const activeOrders = orders.filter(
    (o) =>
      o.status === "confirmed" ||
      o.status === "cooking" ||
      o.status === "ready" ||
      o.status === "placed"
  );

  return (
    <div className="space-y-6">
      {/* KDS Header & Station Filter Tabs */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-serif font-black tracking-wider text-white uppercase">
              Kitchen Display System (KDS)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time station dispatch with live elapsed prep timers
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedStation("all")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border ${
              selectedStation === "all"
                ? "bg-amber text-obsidian border-amber shadow-lg shadow-amber/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All Stations ({activeOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStation("tandoor")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              selectedStation === "tandoor"
                ? "bg-amber text-obsidian border-amber shadow-lg shadow-amber/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Tandoor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedStation("curry")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              selectedStation === "curry"
                ? "bg-amber text-obsidian border-amber shadow-lg shadow-amber/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Soup className="w-3.5 h-3.5" />
            <span>Curry</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedStation("drinks")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              selectedStation === "drinks"
                ? "bg-amber text-obsidian border-amber shadow-lg shadow-amber/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Drinks</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 ml-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>LIVE {currentTime}</span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {activeOrders.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-serif">All stations clear!</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No pending tickets in the kitchen. New orders placed from table QR codes will appear here instantly with live timers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {activeOrders.map((order) => {
              // Filter items for station
              const stationItems =
                selectedStation === "all"
                  ? order.items
                  : order.items.filter((i) => i.station === selectedStation);

              if (stationItems.length === 0) return null;

              return (
                <TicketCard
                  key={order.id}
                  order={order}
                  items={stationItems}
                  onAdvanceOrder={(newStatus) => updateOrderStatus(order.id, newStatus)}
                  onItemStatusChange={(itemId, newStatus) =>
                    updateItemStationStatus(order.id, itemId, newStatus)
                  }
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TicketCard({
  order,
  items,
  onAdvanceOrder,
  onItemStatusChange,
}: {
  order: Order;
  items: OrderItemRecord[];
  onAdvanceOrder: (status: Order["status"]) => void;
  onItemStatusChange: (itemId: string, status: OrderItemRecord["stationStatus"]) => void;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.floor((Date.now() - order.createdAt) / 1000)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - order.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timerStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isUrgent = mins >= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`border rounded-2xl p-4 flex flex-col justify-between transition-all bg-[#151518] ${
        isUrgent
          ? "border-red-500/70 shadow-lg shadow-red-950/20"
          : order.status === "ready"
          ? "border-emerald-500/70 bg-emerald-950/10"
          : "border-zinc-800"
      }`}
    >
      <div>
        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber text-obsidian text-xs font-black font-mono">
              T{order.tableNumber}
            </span>
            <div>
              <div className="font-mono text-xs font-bold text-white">
                {order.orderNumber}
              </div>
              <div className="text-[10px] text-zinc-400">
                {order.assignedWaiterName ? `👤 Server: ${order.assignedWaiterName}` : "Unassigned"}
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
              isUrgent
                ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                : "bg-zinc-900 text-zinc-300 border border-zinc-800"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{timerStr}</span>
          </div>
        </div>

        {/* Item List */}
        <div className="py-3 space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                const nextStatus =
                  item.stationStatus === "pending"
                    ? "cooking"
                    : item.stationStatus === "cooking"
                    ? "ready"
                    : "ready";
                onItemStatusChange(item.id, nextStatus);
              }}
              className={`p-2 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                item.stationStatus === "ready"
                  ? "bg-emerald-950/20 border-emerald-500/40 text-zinc-400 line-through"
                  : item.stationStatus === "cooking"
                  ? "bg-amber/10 border-amber/40 text-white"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">
                  {item.quantity}x {item.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] font-semibold text-amber uppercase px-1.5 py-0.2 rounded bg-amber/15">
                    {item.customization.spiceLevel} spice
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase px-1.5 py-0.2 rounded bg-zinc-800">
                    {item.customization.portionSize}
                  </span>
                  {item.customization.selectedDeal && (
                    <span className="text-[10px] font-semibold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/50">
                      {item.customization.selectedDeal.name}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  item.stationStatus === "ready"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : item.stationStatus === "cooking"
                    ? "bg-amber/20 text-amber"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {item.stationStatus}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Action Footers */}
      <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
        {order.status !== "ready" ? (
          <button
            type="button"
            onClick={() => onAdvanceOrder("ready")}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark All Ready</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdvanceOrder("served")}
            className="flex-1 py-2 px-3 rounded-xl bg-amber hover:bg-amber-500 text-obsidian font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <span>Mark Served to Table</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
