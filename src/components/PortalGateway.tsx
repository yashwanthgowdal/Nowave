import { useState } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  QrCode,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export function PortalGateway() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");

  // If a table number query parameter is present (e.g. from QR scan), route directly to Customer Menu
  if (tableParam) {
    return <Navigate to={`/menu?table=${encodeURIComponent(tableParam)}`} replace />;
  }

  // Customer Card State
  const [customerTable, setCustomerTable] = useState("");

  // Manager Card State
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleEnterCustomerMenu = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customerTable.trim()) {
      navigate(`/menu?table=${encodeURIComponent(customerTable.trim())}`);
    } else {
      navigate("/menu");
    }
  };

  const handleManagerLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const emailToUse = customEmail || managerEmail;
    const passToUse = customPass || managerPassword;

    try {
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, emailToUse, passToUse);
        } catch (signInErr: any) {
          if (
            signInErr.code === "auth/user-not-found" ||
            signInErr.code === "auth/invalid-credential"
          ) {
            try {
              await createUserWithEmailAndPassword(auth, emailToUse, passToUse);
            } catch {
              throw signInErr;
            }
          } else {
            throw signInErr;
          }
        }
      } else {
        // Local demo authentication
        if (
          (emailToUse === "manager@nowave.cafe" && passToUse === "NoWave2024!") ||
          passToUse.length >= 6
        ) {
          localStorage.setItem("nowave_admin_auth", "true");
        } else {
          throw new Error("Invalid manager credentials. Try the 1-Click Demo Login below.");
        }
      }

      navigate("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError(
        err.code === "auth/wrong-password"
          ? "Incorrect manager password."
          : err.code === "auth/invalid-email"
          ? "Invalid email format."
          : err.message || "Failed to sign in. Please verify credentials."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setManagerEmail("manager@nowave.cafe");
    setManagerPassword("NoWave2024!");
    handleManagerLogin(undefined, "manager@nowave.cafe", "NoWave2024!");
  };

  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 font-sans flex flex-col justify-between relative overflow-hidden selection:bg-amber/20 selection:text-amber">
      {/* Ambient background glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[300px] bg-amber/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── BRAND HEADER ─── */}
      <header className="relative z-10 pt-10 pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber/10 border border-amber/30 text-amber font-mono font-bold text-xs uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Hospitality Platform
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-wider text-white">
          NO WAVE
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] font-semibold text-amber mt-1">
          Company
        </p>
        <p className="text-xs sm:text-sm text-zinc-400 italic mt-3 max-w-md mx-auto">
          &ldquo;No Wave. Just Tilt. Dining, Redefined.&rdquo;
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Select your access portal below to continue
        </p>
      </header>

      {/* ─── TWO DISTINCT SEPARATE PORTALS ─── */}
      <main className="max-w-5xl w-full mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* ═════════════════════════════════════════════════════ */}
          {/* PORTAL 1: CUSTOMER ACCESS & DINING MENU */}
          {/* ═════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-obsidian-card border-2 border-obsidian-border hover:border-amber/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 relative group"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber shadow-lg shadow-amber/10">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Diner Access
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-white group-hover:text-amber transition-colors">
                  Customer Dining Menu
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Browse our fresh offerings, dietary filters (Veg / Non-Veg), chef&apos;s specials, and maintain a personal verbal table order checklist.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time kitchen availability synchronization</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero app install, zero login, zero payment gateways</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Built-in verbal table order shortlist helper</span>
                </div>
              </div>

              {/* Table Number Input Form */}
              <form onSubmit={handleEnterCustomerMenu} className="pt-2 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Table Number <span className="text-zinc-500 font-normal normal-case">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customerTable}
                    onChange={(e) => setCustomerTable(e.target.value)}
                    placeholder="e.g. 1, 5, or Patio-2"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                  />
                  {["1", "5", "VIP"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomerTable(num)}
                      className="px-2.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors font-mono"
                    >
                      T-{num}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleEnterCustomerMenu()}
                className="w-full bg-amber hover:bg-brass-dark text-black font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber/20 hover:shadow-amber/30 active:scale-[0.99]"
              >
                <span>Open Customer Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* PORTAL 2: MANAGER & STAFF LOGIN */}
          {/* ═════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-obsidian-card border-2 border-obsidian-border hover:border-amber/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 relative group"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber shadow-lg shadow-amber/10">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber/10 border border-amber/30 text-amber">
                  Staff Portal
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-white group-hover:text-amber transition-colors">
                  Manager Admin Login
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Sign in to access 1-tap stock availability toggles, bulk start-of-day resets, menu item CRUD, and the Table QR Studio.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleManagerLogin} className="space-y-3.5 pt-1">
                {loginError && (
                  <div className="bg-red-950/60 text-red-300 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-800/60">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="manager@nowave.cafe"
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-amber" />
                  <span>{loginLoading ? "Authenticating..." : "Sign In to Admin Dashboard"}</span>
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-obsidian-border/60 space-y-2">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full bg-gradient-to-r from-amber/20 via-amber/10 to-transparent hover:from-amber/30 text-amber border border-amber/40 hover:border-amber font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ One-Click Demo Manager Login</span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center font-mono">
                Credentials: manager@nowave.cafe / NoWave2024!
              </p>
            </div>
          </motion.div>

        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-600 border-t border-obsidian-border/50">
        <p>&copy; {new Date().getFullYear()} No Wave Company. Dining, Redefined.</p>
      </footer>
    </div>
  );
}

export default PortalGateway;