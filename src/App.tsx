import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      {/* Customer Menu Routes (Supports ?table=X on both / and /menu) */}
      <Route path="/" element={<CustomerMenu />} />
      <Route path="/menu" element={<CustomerMenu />} />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Control Panel Routes */}
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
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}

export default App;
