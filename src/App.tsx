import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

  // The 2nd and 3rd domains in your Vercel Domains list contain "-nothing-763e" or "git-main"
  const isManagerDomain =
    hostname.includes("nothing-763e") ||
    hostname.includes("git-main") ||
    hostname.includes("manager") ||
    hostname.includes("admin");

  return (
    <Routes>
      {/* 
        DOMAIN-BASED SPLIT IN VERCEL:
        - 1st Domain (nowaveteam-123.vercel.app): Strictly CUSTOMER MENU
        - 2nd & 3rd Domain (*-nothing-763e.vercel.app): Strictly MANAGER LOGIN
      */}
      <Route
        path="/"
        element={isManagerDomain ? <AdminLogin /> : <CustomerMenu />}
      />

      {/* Customer Menu direct view */}
      <Route path="/menu" element={<CustomerMenu />} />

      {/* Manager direct routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/manager" element={<AdminLogin />} />
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
