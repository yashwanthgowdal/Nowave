"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Printer, Copy, Check, ExternalLink, Sparkles, Wifi, AlertTriangle, RefreshCw } from "lucide-react";

interface QRGeneratorProps {
  initialTable?: string;
  baseUrl?: string;
}

export function QRGenerator({ initialTable = "1", baseUrl }: QRGeneratorProps) {
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const printCardRef = useRef<HTMLDivElement>(null);

  // Production live domain as default origin
  const productionDomain = "https://nowaveteam-123.vercel.app";

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
  const targetUrl = `${origin}/menu?table=${encodeURIComponent(tableNumber)}`;
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `nowave-table-${tableNumber}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-obsidian-card border border-obsidian-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-obsidian-border">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber" />
              Table QR Code Generator
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Generate print-ready, high-resolution QR codes mapped to specific restaurant tables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
              Quick Pick:
            </span>
            {["1", "2", "5", "8", "12", "VIP"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTableNumber(num)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  tableNumber === num
                    ? "bg-amber text-black font-semibold"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* Controls */}
          <div className="space-y-5">
            {/* Host URL / Server Base */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-amber" />
                  Menu Server Address (Base URL)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {isLocalhost ? "⚠️ Localhost" : "🟢 Network / Live"}
                </span>
              </div>

              <input
                type="text"
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                placeholder="e.g. http://10.167.163.103:3000 or https://nowave.cafe"
                className="w-full px-3 py-2 rounded-lg bg-obsidian border border-obsidian-border text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomOrigin(productionDomain)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    customOrigin === productionDomain
                      ? "bg-amber text-black font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  <span>🟢 Live Vercel Domain</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomOrigin(typeof window !== "undefined" ? window.location.origin : productionDomain)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    customOrigin !== productionDomain
                      ? "bg-amber text-black font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Current Browser Origin
                </button>
              </div>

              {/* Notice for phone scanning */}
              {isLocalhost && (
                <div className="p-2.5 rounded-lg bg-amber/10 border border-amber/30 text-amber text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Phone Scanning Notice:</span> When scanning with a phone camera, phones cannot reach <code className="bg-black/40 px-1 rounded">localhost</code>. Click the <strong>Wi-Fi Phone IP</strong> button above so phones connected to your Wi-Fi can open the menu.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Table Identifier / Number
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 5 or Patio-2"
                className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border text-white text-lg font-mono focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                When scanned, the customer's phone automatically tags their view as Table {tableNumber}.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Customer Destination URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-zinc-400 text-xs font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 bg-amber hover:bg-brass-dark text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber/20"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Print Table Stand
              </button>

              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </a>
            </div>
          </div>

          {/* Luxury Table Stand Card Preview */}
          <div className="flex flex-col items-center justify-center">
            <div
              ref={printCardRef}
              className="w-full max-w-[280px] bg-gradient-to-b from-zinc-900 via-obsidian to-black border-2 border-amber/40 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden print:m-0 print:border-black"
            >
              {/* Subtle luxury glow ornament */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-center gap-1.5 text-amber mb-2">
                <Sparkles className="w-4 h-4 text-amber" />
                <span className="text-[10px] tracking-widest uppercase font-semibold text-amber/90">
                  Exclusive Table Service
                </span>
              </div>

              <h3 className="font-serif text-xl font-bold tracking-wider text-white">
                NO WAVE
              </h3>
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-sans mt-0.5">
                Company
              </p>

              {/* QR Image Box */}
              <div className="my-5 p-3 bg-white rounded-2xl shadow-xl mx-auto w-fit">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for Table ${tableNumber}`}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center text-zinc-400 text-xs">
                    Generating...
                  </div>
                )}
              </div>

              {/* Table Pill */}
              <div className="inline-block bg-amber/15 border border-amber/40 text-amber font-mono font-bold text-xs uppercase px-4 py-1.5 rounded-full mb-3">
                Table {tableNumber}
              </div>

              <p className="text-xs text-zinc-300 font-medium">
                Scan with phone camera to view live menu
              </p>
              <p className="text-[10px] text-zinc-500 italic mt-2">
                &ldquo;No Wave. Just Tilt. Dining, Redefined.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
