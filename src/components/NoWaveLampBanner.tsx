"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, X, Check } from "lucide-react";

interface NoWaveLampBannerProps {
  tableNumber?: string | null;
  compact?: boolean;
}

export function NoWaveLampBanner({ tableNumber, compact = false }: NoWaveLampBannerProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [isTilted, setIsTilted] = useState(false);

  return (
    <>
      <div
        className={`w-full rounded-2xl border transition-all ${
          compact
            ? "p-2.5 bg-gradient-to-r from-amber/10 via-[#181716] to-[#181716] border-amber/30 text-xs"
            : "p-4 bg-gradient-to-r from-[#1c1a17] via-[#161514] to-[#131211] border-amber/40 shadow-xl shadow-amber/5"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Animated Lamp Icon */}
          <div className="flex items-center gap-3">
            <motion.div
              onClick={() => setIsTilted(!isTilted)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              title="Click to see lamp tilt mechanism"
              className="cursor-pointer relative w-10 h-10 rounded-xl bg-[#221f1b] border border-amber/40 flex items-center justify-center shrink-0 shadow-md group"
            >
              {/* Lamp Body Icon */}
              <motion.div
                animate={{ rotate: isTilted ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-5 h-6 flex flex-col items-center justify-center"
              >
                {/* Lamp Shade / Glow Head */}
                <div
                  className={`w-4 h-3 rounded-t-sm transition-colors duration-300 ${
                    isTilted
                      ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                      : "bg-[#FBF8F3] shadow-[0_0_10px_rgba(251,248,243,0.7)]"
                  }`}
                />
                {/* Wooden Walnut Cylinder Base */}
                <div className="w-3 h-3 bg-[#8B5A2B] rounded-b-sm border-t border-black/20" />
              </motion.div>

              {/* Pulsing beacon ring when tilted */}
              {isTilted && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </motion.div>

            {/* Instruction Text */}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xs sm:text-sm text-[#FBF8F3] tracking-wide">
                  No Wave. Just Tilt.
                </span>
                {tableNumber && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber/20 text-amber rounded border border-amber/30">
                    Table {tableNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-snug">
                Need water, napkins, or staff? <span className="text-amber font-semibold">Flip the lamp on your table to Red</span> — our floor team is watching.
              </p>
            </div>
          </div>

          {/* Info pill */}
          <button
            type="button"
            onClick={() => setShowExplainer(true)}
            className="text-[11px] text-amber hover:text-white font-semibold flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber/40 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How it works</span>
          </button>
        </div>
      </div>

      {/* Explainer Modal */}
      <AnimatePresence>
        {showExplainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#181716] border border-amber/40 rounded-3xl p-6 shadow-2xl text-center"
            >
              <button
                type="button"
                onClick={() => setShowExplainer(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center mx-auto text-amber mb-3">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="font-serif text-xl font-bold text-white">
                The NoWave Dining Promise
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Zero hand-waving. Zero shouting. Pure dining presence.
              </p>

              <div className="space-y-3 mt-6 text-left text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FBF8F3] shadow-[0_0_8px_rgba(251,248,243,0.8)] shrink-0" />
                  <div>
                    <p className="font-bold text-white">Position 1: Warm Amber Light</p>
                    <p className="text-[11px] text-zinc-400">
                      Dine undisturbed. Staff will not interrupt your conversation.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold text-red-300">Position 2: Inverted Crimson Red</p>
                    <p className="text-[11px] text-zinc-400">
                      Tilt 180°. A floor captain will attend to your table immediately.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExplainer(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-amber text-obsidian font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
