"use client";

import { QRGenerator } from "@/components/QRGenerator";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default function AdminQRPage() {
  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 font-sans pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-obsidian-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-obsidian-border transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-white text-base">
                  NO WAVE
                </span>
                <span className="text-[10px] bg-amber/20 border border-amber/40 text-amber font-mono font-bold px-2 py-0.5 rounded-md">
                  QR STUDIO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                High-Resolution Table QR Card Generator
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="text-xs text-amber hover:underline underline-offset-4"
          >
            Back to Control Panel
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <QRGenerator />
      </main>
    </div>
  );
}
