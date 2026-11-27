"use client";

import { Link } from "react-router-dom";
import { KitchenDisplaySystem } from "./KitchenDisplaySystem";
import { ArrowLeft, ChefHat, ShieldCheck, ExternalLink } from "lucide-react";

export function StandaloneKDSPage() {
  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 font-sans pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-obsidian-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              title="Return to Manager Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center text-amber">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide">
                  NOWAVE KITCHEN DISPLAY SYSTEM
                </h1>
                <p className="text-[10px] text-zinc-400">
                  Station-Routed Live Order Dispatch & Prep Timers
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber" />
              <span>Manager Panel</span>
            </Link>
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-amber hover:bg-amber-500 text-obsidian text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Customer Menu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main KDS View */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        <KitchenDisplaySystem />
      </main>
    </div>
  );
}
