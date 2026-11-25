import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles, Cloud, CloudOff, UtensilsCrossed, Lock } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError("");
    setLoading(true);

    try {
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, loginEmail, loginPass);
        } catch (signInErr: any) {
          // If manager user doesn't exist yet in newly created Firebase project, auto-register on first demo login
          if (
            signInErr.code === "auth/user-not-found" ||
            signInErr.code === "auth/invalid-credential"
          ) {
            try {
              await createUserWithEmailAndPassword(auth, loginEmail, loginPass);
            } catch {
              throw signInErr;
            }
          } else {
            throw signInErr;
          }
        }
      } else {
        // Fallback demo authentication
        if (
          (loginEmail === "manager@nowave.cafe" && loginPass === "NoWave2024!") ||
          loginPass.length >= 6
        ) {
          localStorage.setItem("nowave_admin_auth", "true");
        } else {
          throw new Error("Invalid manager credentials. Use demo login below.");
        }
      }

      navigate("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.code === "auth/wrong-password"
          ? "Incorrect manager password."
          : err.code === "auth/invalid-email"
          ? "Invalid email format."
          : err.message || "Failed to sign in. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleInstantDemoLogin = async () => {
    setEmail("manager@nowave.cafe");
    setPassword("NoWave2024!");
    await executeLogin("manager@nowave.cafe", "NoWave2024!");
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4 relative font-sans text-zinc-100">
      {/* Warm ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Back to Customer Menu button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-obsidian-border"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View Customer Menu</span>
        </Link>
      </div>

      {/* Top Portal Switcher Bar */}
      <div className="w-full max-w-md mb-6 z-10 flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
          <Link
            to="/menu"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Customer Menu</span>
          </Link>
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber text-black flex items-center gap-1.5 shadow-md shadow-amber/20 cursor-default">
            <Lock className="w-3.5 h-3.5" />
            <span>Manager Login</span>
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber/15 border border-amber/30 text-amber mb-4 shadow-xl shadow-amber/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-wider text-white">
            NO WAVE
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-amber font-semibold mt-0.5">
            Manager Control Panel
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-zinc-400">
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5" /> Firebase Cloud Auth
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <CloudOff className="w-3.5 h-3.5 text-zinc-500" /> Local Fallback Mode
              </span>
            )}
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-3xl shadow-2xl p-7 space-y-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/60 text-red-300 px-4 py-3 rounded-xl text-xs font-medium border border-red-800/60"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Manager Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-all"
                placeholder="manager@nowave.cafe"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber hover:bg-brass-dark text-black font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Control Panel
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Button */}
          <div className="pt-4 border-t border-obsidian-border">
            <p className="text-[11px] text-center text-zinc-500 uppercase tracking-widest font-semibold mb-3">
              Instant Demonstration Mode
            </p>
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-amber/30 hover:border-amber py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold group shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber group-hover:scale-110 transition-transform" />
              <span>⚡ One-Click Demo Manager Login</span>
            </button>
            <div className="text-[11px] font-mono text-zinc-500 text-center mt-2">
              manager@nowave.cafe • NoWave2024!
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
