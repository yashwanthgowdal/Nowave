"use client";

import { Suspense } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-sans">Connecting to Manager Control Panel...</p>
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
