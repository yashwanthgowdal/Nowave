import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { StandaloneKDSPage } from "@/components/StandaloneKDSPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

  // Dedicated Domain Separation:
  // 1. Customer Site Domain: nowaveteam-123-git-main-nothing-763e.vercel.app
  // 2. Manager Site Domain (Vercel Share Link): nowaveteam-123.vercel.app
  const isCustomerDomain = hostname.includes("git-main");

  return (
    <Routes>
      {/* 
        - nowaveteam-123.vercel.app (Share link): Strictly MANAGER SITE
        - nowaveteam-123-git-main-nothing-763e.vercel.app: Strictly CUSTOMER SITE
      */}
      <Route
        path="/"
        element={isCustomerDomain ? <CustomerMenu /> : <AdminLogin />}
      />

      {/* Customer Menu direct views */}
      <Route path="/menu" element={<CustomerMenu />} />
      <Route path="/table" element={<CustomerMenu />} />
      <Route path="/table/:tableId" element={<CustomerMenu />} />

      {/* Manager direct routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/manager" element={<AdminLogin />} />
      <Route path="/login" element={<AdminLogin />} />
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

      {/* Dedicated Kitchen Display System (KDS) */}
      <Route
        path="/kds"
        element={
          <ProtectedRoute>
            <StandaloneKDSPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route
        path="*"
        element={<Navigate to={isCustomerDomain ? "/menu" : "/admin/login"} replace />}
      />
    </Routes>
  );
}

export default App;
