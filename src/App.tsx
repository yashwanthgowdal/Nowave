import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

  // Dedicated Manager Domain detector:
  // - nowaveteam-123-prqi0j11z-nothing-763e.vercel.app
  // - nowaveteam-123-git-main-nothing-763e.vercel.app
  // - any domain containing admin or manager
  const isManagerDomain =
    hostname.includes("nothing-763e") ||
    hostname.includes("prqi0j1") ||
    hostname.includes("git-main") ||
    hostname.includes("admin") ||
    hostname.includes("manager");

  return (
    <Routes>
      {/* 
        DOMAIN-BASED ROUTING:
        - 1st Domain (nowaveteam-123.vercel.app): Strictly User / Customer Menu
        - 2nd Domain (nowaveteam-123-git-main-...): Strictly Manager Login
      */}
      <Route
        path="/"
        element={isManagerDomain ? <AdminLogin /> : <CustomerMenu />}
      />

      {/* Customer Menu direct view */}
      <Route path="/menu" element={<CustomerMenu />} />

      {/* Manager direct routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/qr"
        element={
          <ProtectedRoute>
            <AdminQRPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route
        path="*"
        element={<Navigate to={isManagerDomain ? "/admin/login" : "/"} replace />}
      />
    </Routes>
  );
}

export default App;
