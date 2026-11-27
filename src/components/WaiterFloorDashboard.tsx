import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  LogOut,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useRestaurantStore } from "@/lib/useRestaurantStore";
import { Waiter } from "@/lib/types";

const WAITER_STORAGE_KEY = "nowave_active_waiter_v1";

export function WaiterFloorDashboard() {
  const {
    tables,
    orders,
    waiters,
    claimTable,
    transferTable,
    waiterDirectVerify,
    resetTable,
  } = useRestaurantStore();

  const [activeWaiter, setActiveWaiter] = useState<Waiter | null>(null);
  const [selectedStaffForLogin, setSelectedStaffForLogin] = useState<Waiter | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Restore staff session from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(WAITER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = waiters.find((w) => w.id === parsed.id);
          if (found) setActiveWaiter(found);
        } catch {}
      }
    }
  }, [waiters]);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForLogin) return;

    if (pinInput.trim() === selectedStaffForLogin.pin || pinInput.trim() === "1234") {
      setActiveWaiter(selectedStaffForLogin);
      sessionStorage.setItem(WAITER_STORAGE_KEY, JSON.stringify(selectedStaffForLogin));
      setLoginError(null);
      setPinInput("");
    } else {
      setLoginError("Invalid PIN. Default staff PIN is 1234.");
    }
  };

  const handleLogout = () => {
    setActiveWaiter(null);
    setSelectedStaffForLogin(null);
    sessionStorage.removeItem(WAITER_STORAGE_KEY);
  };

  const handleClaim = (tableNumber: string) => {
    if (!activeWaiter) return;
    const res = claimTable(tableNumber, activeWaiter.id, activeWaiter.name);
    if (res.success) {
      showTemporaryToast(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleDirectVerify = (tableNumber: string) => {
    if (!activeWaiter) return;
    waiterDirectVerify(tableNumber, activeWaiter.id);
    showTemporaryToast(`Table ${tableNumber} verified! Order sent to kitchen.`);
  };

  const handleTransfer = (tableNumber: string, newWaiterId: string) => {
    const target = waiters.find((w) => w.id === newWaiterId);
    if (!target) return;
    transferTable(tableNumber, target.id, target.name);
    showTemporaryToast(`Table ${tableNumber} transferred to ${target.name}.`);
  };

  const handleReset = (tableNumber: string) => {
    if (confirm(`Reset Table ${tableNumber} back to available? (Clears session & generates fresh OTP)`)) {
      resetTable(tableNumber);
      showTemporaryToast(`Table ${tableNumber} reset to available.`);
    }
  };

  const showTemporaryToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Filter urgent tables awaiting verification
  const pendingVerificationTables = tables.filter(
    (t) =>
      t.status === "awaiting_verification" ||
      orders.some((o) => o.tableNumber === t.tableNumber && o.status === "awaiting_verification")
  );

  // Filter tables assigned to current waiter
  const myAssignedTables = tables.filter(
    (t) => t.assignedWaiterId === activeWaiter?.id && t.status !== "available"
  );

  // ─── LOGIN SCREEN IF NOT AUTHENTICATED ───
  if (!activeWaiter) {
    return (
      <div className="min-h-screen bg-[#11100F] text-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#181615] border border-amber/30 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber text-xs font-mono font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              Staff Floor Access
            </div>
            <h1 className="text-3xl font-serif text-[#FAF7F2]">Waiter Floor View</h1>
            <p className="text-xs text-zinc-400">
              Select your name to claim tables and verify 4-digit guest OTPs
            </p>
          </div>

          {!selectedStaffForLogin ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select Your Profile:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {waiters.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedStaffForLogin(w)}
                    className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-amber/60 hover:bg-black/60 transition-all text-left flex flex-col justify-between group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black"
                      style={{ backgroundColor: w.avatarColor || "#C59B43" }}
                    >
                      {w.name[0]}
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-bold text-[#FAF7F2] group-hover:text-amber">
                        {w.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 capitalize">{w.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black"
                    style={{ backgroundColor: selectedStaffForLogin.avatarColor || "#C59B43" }}
                  >
                    {selectedStaffForLogin.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{selectedStaffForLogin.name}</div>
                    <div className="text-[10px] text-zinc-400">Staff PIN Required</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffForLogin(null)}
                  className="text-xs text-amber hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Enter 4-Digit PIN (Default: 1234)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 rounded-2xl bg-black/60 border border-amber/40 text-amber focus:border-amber outline-none"
                />
              </div>

              {loginError && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 p-2 rounded-xl text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber to-amber-600 text-black font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber/20"
              >
                Sign In to Floor Dashboard
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <Link to="/admin" className="hover:text-amber flex items-center gap-1">
              Manager Panel <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/kds" className="hover:text-amber flex items-center gap-1">
              Kitchen KDS <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED WAITER FLOOR DASHBOARD ───
  return (
    <div className="min-h-screen bg-[#11100F] text-[#FAF7F2] pb-24 font-sans antialiased">
      {/* ─── TOP HEADER ─── */}
      <header className="sticky top-0 z-40 bg-[#181615]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black"
              style={{ backgroundColor: activeWaiter.avatarColor || "#C59B43" }}
            >
              {activeWaiter.name[0]}
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>{activeWaiter.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-zinc-400">
                {myAssignedTables.length} Active Tables Handled
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/kds"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1"
            >
              KDS
            </Link>
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900/30 text-xs flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {actionSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionSuccess}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* ─── 1. URGENT: ORDERS AWAITING VERIFICATION ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber/20 text-amber">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-serif font-bold text-[#FAF7F2]">
                Needs In-Seat Verification ({pendingVerificationTables.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-400">Blocks fake remote orders</span>
          </div>

          {pendingVerificationTables.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#181615] border border-white/5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">All tables verified!</p>
              <p className="text-xs text-zinc-500">
                New customer orders requiring 4-digit OTP will flash here instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingVerificationTables.map((table) => {
                const activeOrder = orders.find(
                  (o) => o.tableNumber === table.tableNumber && o.status === "awaiting_verification"
                );
                const isClaimedByMe = table.assignedWaiterId === activeWaiter.id;
                const isClaimedByOther =
                  table.assignedWaiterId && table.assignedWaiterId !== activeWaiter.id;

                return (
                  <div
                    key={table.tableNumber}
                    className={`p-5 rounded-3xl border shadow-xl transition-all space-y-4 ${
                      isClaimedByMe
                        ? "bg-gradient-to-b from-[#241f17] to-[#181615] border-amber/60 shadow-amber/10"
                        : isClaimedByOther
                        ? "bg-[#161514] border-zinc-800 opacity-75"
                        : "bg-gradient-to-b from-[#1f1a14] to-[#181615] border-amber/40 animate-pulse"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/20 border border-amber/40 text-amber font-mono font-bold text-sm">
                        {table.tableLabel || `Table ${table.tableNumber}`}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        {activeOrder ? `₹${activeOrder.totalAmount}` : "New Order"}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {activeOrder && (
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-1">
                        <div className="font-semibold text-zinc-300">Order Items:</div>
                        <div className="text-zinc-400 truncate">
                          {activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </div>
                      </div>
                    )}

                    {/* Claim / Code Status */}
                    {isClaimedByMe ? (
                      <div className="space-y-3 pt-2 border-t border-amber/20">
                        <div className="text-center space-y-1">
                          <div className="text-[11px] uppercase tracking-wider text-amber font-semibold">
                            {table.tableLabel || `Table ${table.tableNumber}`} 4-Digit Verification Code
                          </div>
                          {/* Glowing 4-Digit Display */}
                          <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-black/80 border-2 border-amber shadow-lg shadow-amber/30 text-amber font-mono text-3xl font-extrabold tracking-[0.25em]">
                            {table.verificationOtp || "4829"}
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Walk to {table.tableLabel || `Table ${table.tableNumber}`}. Confirm guests are seated and give them this code.
                          </p>
                        </div>

                        {/* Direct Verify Override Button */}
                        <button
                          type="button"
                          onClick={() => handleDirectVerify(table.tableNumber)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Waiter Direct Verify (Bypass Guest Code)
                        </button>
                      </div>
                    ) : isClaimedByOther ? (
                      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                        <div className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber" />
                          Claimed by {table.assignedWaiterName}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Staff is physically checking this table
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaim(table.tableNumber)}
                        className="w-full py-3.5 rounded-2xl bg-amber hover:bg-amber-400 text-obsidian font-extrabold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber/20"
                      >
                        <UserCheck className="w-4 h-4" />
                        Claim {table.tableLabel || `Table ${table.tableNumber}`} & Get Code
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── 2. MY ASSIGNED ACTIVE TABLES ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[#FAF7F2]">
              My Active Tables ({myAssignedTables.length})
            </h2>
            <span className="text-xs text-zinc-400">Locked to you for the session</span>
          </div>

          {myAssignedTables.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#181615] border border-white/5 text-center text-xs text-zinc-500">
              You haven't claimed any active dining tables yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAssignedTables.map((t) => {
                const activeOrder = orders.find(
                  (o) => o.tableNumber === t.tableNumber && o.status !== "completed"
                );

                return (
                  <div
                    key={t.tableNumber}
                    className="p-5 rounded-3xl bg-[#181615] border border-white/10 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber/20 text-amber font-bold font-mono text-xs flex items-center justify-center">
                          T{t.tableNumber}
                        </span>
                        <span className="text-sm font-bold">Table {t.tableNumber}</span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                          t.status === "cooking"
                            ? "bg-amber/20 text-amber border border-amber/40"
                            : t.status === "eating"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : t.status === "paid"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    {activeOrder && (
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-300 font-semibold">
                          <span>Order {activeOrder.orderNumber}</span>
                          <span className="text-amber">₹{activeOrder.totalAmount}</span>
                        </div>
                        <div className="text-zinc-400 truncate">
                          {activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </div>
                      </div>
                    )}

                    {/* Actions: Transfer & Reset */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <div className="flex-1 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-zinc-300">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
                        <select
                          className="bg-transparent text-zinc-200 outline-none w-full text-xs"
                          value={t.assignedWaiterId || ""}
                          onChange={(e) => handleTransfer(t.tableNumber, e.target.value)}
                        >
                          <option value="" disabled>
                            Transfer to...
                          </option>
                          {waiters.map((w) => (
                            <option key={w.id} value={w.id} className="bg-[#181615]">
                              {w.name} {w.id === activeWaiter.id ? "(Current)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReset(t.tableNumber)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1"
                        title="Reset Table Session"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── 3. OVERALL FLOOR STATUS ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[#FAF7F2]">All Dining Tables ({tables.length})</h2>
            <span className="text-xs text-zinc-400">Café Floor Overview</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tables.map((t) => (
              <div
                key={t.tableNumber}
                className="p-3.5 rounded-2xl bg-[#181615] border border-white/5 space-y-2 text-center"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-zinc-300">
                    {t.tableLabel || `T${t.tableNumber}`}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      t.status === "available"
                        ? "bg-zinc-600"
                        : t.status === "browsing"
                        ? "bg-blue-400 animate-pulse"
                        : t.status === "awaiting_verification"
                        ? "bg-amber animate-ping"
                        : "bg-emerald-400"
                    }`}
                  />
                </div>
                <div className="text-xs font-bold capitalize text-white truncate">{t.status}</div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {t.assignedWaiterName ? `👤 ${t.assignedWaiterName}` : "Unassigned"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
