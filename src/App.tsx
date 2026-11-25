import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      {/* 1. CUSTOMER LINK: Strictly Customer Digital Menu */}
      <Route path="/" element={<CustomerMenu />} />
      <Route path="/menu" element={<CustomerMenu />} />

      {/* 2. MANAGER LINK: Strictly Manager Admin Login & Dashboard */}
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
