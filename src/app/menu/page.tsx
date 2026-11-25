"use client";

import { Suspense } from "react";
import { CustomerMenu } from "@/components/CustomerMenu";

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-sans">Connecting to live menu...</p>
        </div>
      }
    >
      <CustomerMenu />
    </Suspense>
  );
}
