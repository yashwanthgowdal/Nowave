"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { useRestaurantStore } from "@/lib/useRestaurantStore";
import { TableSession } from "@/lib/types";

interface QRGeneratorProps {
  initialTable?: string;
  baseUrl?: string;
}

export function QRGenerator({ initialTable = "1", baseUrl }: QRGeneratorProps) {
  const { tables, createTable, deleteTable, resetTable } = useRestaurantStore();

  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Table Form Modal state
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Dedicated Customer domain for table QR codes
  const productionDomain = "https://nowaveteam-123-git-main-nothing-763e.vercel.app";

  // State for user-configurable base URL / origin
  const [customOrigin, setCustomOrigin] = useState<string>(() => {
    if (baseUrl) return baseUrl;
    if (typeof window !== "undefined") {
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        return window.location.origin;
      }
    }
    return productionDomain;
  });

  const origin = customOrigin.replace(/\/+$/, "");
  const targetUrl = `${origin}/table/${encodeURIComponent(selectedTable)}`;
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

  useEffect(() => {
    QRCode.toDataURL(
      targetUrl,
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#0F0F11",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [targetUrl]);

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQrForTable = async (table: TableSession) => {
    const tableUrl = `${origin}/table/${encodeURIComponent(table.tableNumber)}`;
    try {
      const dataUrl = await QRCode.toDataURL(tableUrl, {
        width: 600,
        margin: 2,
        color: { dark: "#0F0F11", light: "#FFFFFF" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `nowave-qr-${table.tableNumber}.png`;
      a.click();
    } catch {}
  };

  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    await createTable({
      tableNumber: newTableNumber.trim(),
      tableLabel: newTableLabel.trim() || undefined,
      guestCount: Number(newTableCapacity) || 4,
    });

    setSelectedTable(newTableNumber.trim());
    setCreateMsg(`Created ${newTableLabel || `Table ${newTableNumber}`} successfully!`);
    setNewTableNumber("");
    setNewTableLabel("");
    setIsAddTableOpen(false);
    setTimeout(() => setCreateMsg(null), 3000);
  };

  const handleDelete = async (tableNumber: string) => {
    if (confirm(`Delete Table ${tableNumber}? This will remove it from floor maps and QR directory.`)) {
      await deleteTable(tableNumber);
    }
  };

  const activeTableObj = tables.find(
    (t) => t.tableNumber.toLowerCase() === selectedTable.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* ─── 1. TOP QR GENERATOR HERO CARD ─── */}
      <div className="bg-obsidian-card border border-obsidian-border rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-obsidian-border">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber" />
              Dynamic Table QR Code Studio
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Generate print-ready QR codes for any table number or custom zone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddTableOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber hover:bg-amber-400 text-obsidian font-extrabold text-xs shadow-lg shadow-amber/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Add New Dynamic Table
          </button>
        </div>

        {createMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
            {createMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* Left Controls */}
          <div className="space-y-5">
            {/* Host Base URL */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-amber" />
                  Menu Server Address (Base URL)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {isLocalhost ? "⚠️ Localhost" : "🟢 Live Cloud"}
                </span>
              </div>

              <input
                type="text"
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber"
              />

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomOrigin(productionDomain)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    customOrigin === productionDomain
                      ? "bg-amber text-black font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  🟢 Customer Domain (git-main)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCustomOrigin(
                      typeof window !== "undefined" ? window.location.origin : productionDomain
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    customOrigin !== productionDomain
                      ? "bg-amber text-black font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Current Browser Origin
                </button>
              </div>
            </div>

            {/* Select Table or Type Any Custom Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Active Table Selection
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  placeholder="e.g. 14, Patio-2, Rooftop-A"
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border text-white text-base font-mono focus:outline-none focus:border-amber"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Type any table number or custom zone name. The system handles it dynamically.
              </p>
            </div>

            {/* Quick Pick Chips */}
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Quick Select Registered Tables:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tables.map((t) => (
                  <button
                    key={t.tableNumber}
                    type="button"
                    onClick={() => setSelectedTable(t.tableNumber)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedTable.toLowerCase() === t.tableNumber.toLowerCase()
                        ? "bg-amber text-black font-bold"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {t.tableLabel || t.tableNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Destination QR URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-zinc-400 text-xs font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(targetUrl, "main-hero")}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5"
                >
                  {copiedId === "main-hero" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "main-hero" ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-amber/20 hover:bg-amber/30 text-amber text-xs flex items-center gap-1.5 font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Printable Physical Table Display Stand */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#181615] to-[#121110] border border-amber/30 rounded-3xl text-center space-y-4 shadow-2xl relative">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-amber font-mono font-bold">
                Exclusive Table Service
              </div>
              <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
                NO WAVE
              </h3>
              <p className="text-xs text-zinc-400 italic">No Wave. Just Tilt.</p>
            </div>

            {/* QR Code Graphic */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-amber/40">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Table QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-400 text-xs font-mono">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full bg-amber/20 text-amber font-mono font-bold text-sm">
                {activeTableObj?.tableLabel || `Table ${selectedTable}`}
              </div>
              <p className="text-[11px] text-zinc-400">
                Scan with smartphone camera to view menu & order
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const a = document.createElement("a");
                a.href = qrDataUrl;
                a.download = `nowave-table-${selectedTable}.png`;
                a.click();
              }}
              className="py-2 px-5 rounded-xl bg-amber hover:bg-amber-400 text-obsidian text-xs font-bold shadow-md shadow-amber/20 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Printable Stand (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. COMPLETE TABLE DIRECTORY & QR ACTIONS ─── */}
      <div className="bg-obsidian-card border border-obsidian-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-border">
          <div>
            <h3 className="text-lg font-serif font-bold text-white">
              Restaurant Floor Tables Directory ({tables.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Every table dynamically connected to Supabase Realtime & Waiter Assignment
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddTableOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber" />
            Add Table
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Table</th>
                <th className="py-3 px-3">Display Label</th>
                <th className="py-3 px-3">Capacity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Waiter</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {tables.map((t) => {
                const tableUrl = `${origin}/table/${encodeURIComponent(t.tableNumber)}`;
                const isCopied = copiedId === t.tableNumber;

                return (
                  <tr key={t.tableNumber} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
                        {t.tableNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-200">
                      {t.tableLabel || `Table ${t.tableNumber}`}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-500" />
                        {t.guestCount || 4} seats
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          t.status === "available"
                            ? "bg-zinc-800 text-zinc-400"
                            : t.status === "browsing"
                            ? "bg-blue-950 text-blue-400 border border-blue-800/40"
                            : t.status === "awaiting_verification"
                            ? "bg-amber text-black font-extrabold"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {t.assignedWaiterName ? (
                        <span className="text-amber font-semibold">👤 {t.assignedWaiterName}</span>
                      ) : (
                        <span className="text-zinc-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(tableUrl, t.tableNumber)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                          title="Copy Table Menu Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Download QR */}
                        <button
                          type="button"
                          onClick={() => handleDownloadQrForTable(t)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber transition-colors"
                          title="Download QR Image (PNG)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Open Test Tab */}
                        <a
                          href={tableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-amber/20 hover:bg-amber/30 text-amber transition-colors"
                          title="Open Customer Menu in Test Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Reset Table */}
                        <button
                          type="button"
                          onClick={() => resetTable(t.tableNumber)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Reset Table Session & OTP"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Table */}
                        <button
                          type="button"
                          onClick={() => handleDelete(t.tableNumber)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete Table"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 3. MODAL: ADD NEW CUSTOM TABLE ─── */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#181615] border border-amber/30 rounded-3xl p-6 shadow-2xl space-y-5 text-[#FAF7F2]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber" />
                Add New Restaurant Table
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTableOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateNewTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Table Number / ID (e.g. 15, Patio-2, VIP)
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 15 or Patio-3"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white font-mono text-sm focus:border-amber outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Display Label (e.g. Patio Table 3)
                </label>
                <input
                  type="text"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  placeholder="Optional display name"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm focus:border-amber outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Seating Capacity (Guests)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm focus:border-amber outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber hover:bg-amber-400 text-obsidian font-bold text-sm shadow-lg shadow-amber/20 transition-all"
              >
                Create Table & Generate QR Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
