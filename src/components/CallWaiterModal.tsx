"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Droplets, Scroll, Receipt, HelpCircle, Sparkles } from "lucide-react";
import { ServiceRequestType } from "@/lib/types";
import { playBellSound } from "@/lib/audioService";
import { RestaurantStore } from "@/lib/RestaurantStore";

interface CallWaiterModalProps {
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CallWaiterModal({
  tableNumber,
  isOpen,
  onClose,
}: CallWaiterModalProps) {
  const [selectedType, setSelectedType] = useState<ServiceRequestType>("water");
  const [called, setCalled] = useState(false);

  const handleCallWaiter = (type?: ServiceRequestType) => {
    const requestType = type || selectedType;
    RestaurantStore.callWaiter(tableNumber, requestType);
    playBellSound();
    setCalled(true);
    setTimeout(() => {
      setCalled(false);
      onClose();
    }, 2400);
  };

  const quickPills: { type: ServiceRequestType; label: string; icon: any }[] = [
    { type: "water", label: "Water", icon: Droplets },
    { type: "napkins", label: "Napkins", icon: Scroll },
    { type: "bill", label: "Bill", icon: Receipt },
    { type: "help", label: "Help", icon: HelpCircle },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-sm bg-[#161619] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center overflow-hidden"
          >
            {/* Ambient Red Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/15 blur-[60px] pointer-events-none rounded-full" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">
              Table {tableNumber}
            </span>
            <h3 className="font-serif text-2xl font-bold text-white mt-1">
              Need something?
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Press the bell or tap a quick request below
            </p>

            {/* Pulsing Bell Button */}
            <div className="my-8 flex justify-center">
              <div className="relative">
                {/* Glow rings */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-red-500 rounded-full blur-xl"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleCallWaiter()}
                  className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-1 shadow-2xl shadow-red-500/30 flex flex-col items-center justify-center text-white font-bold group cursor-pointer"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-red-600 to-red-700 flex flex-col items-center justify-center border border-white/20">
                    <Bell className="w-9 h-9 text-white group-hover:rotate-12 transition-transform duration-300 fill-white/20" />
                    <span className="text-xs uppercase tracking-wider font-extrabold mt-1.5">
                      Call Waiter
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Quick Request Pills */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickPills.map((pill) => {
                const Icon = pill.icon;
                const isSelected = selectedType === pill.type;
                return (
                  <button
                    key={pill.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(pill.type);
                      handleCallWaiter(pill.type);
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-red-400" />
                    <span className="text-[11px] font-semibold">{pill.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Confirmation Feedback */}
            <AnimatePresence>
              {called && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  <span>Waiter is coming to Table {tableNumber}!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
