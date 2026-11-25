import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. If Firebase is active and configured
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(Boolean(user));
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // 2. Local Fallback Mode
    const localAuth =
      localStorage.getItem("nowave_admin_auth") === "true" ||
      sessionStorage.getItem("nowave_admin_auth") === "true";
    setIsAuthenticated(localAuth);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-sans">Verifying manager credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
