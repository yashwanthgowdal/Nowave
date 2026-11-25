import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      {/* 1. Main Share Links & Root (/) -> Strictly Manager Login */}
      <Route path="/" element={<AdminLogin />} />
      <Route path="/manager" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
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

      {/* 2. Customer Menu (Used by Diners & Table QR Codes: /menu?table=X) */}
      <Route path="/menu" element={<CustomerMenu />} />

      {/* Catch-all redirect to Manager Login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
