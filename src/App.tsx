import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerMenu } from "@/components/CustomerMenu";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminQRPage } from "@/components/AdminQRPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const search =
    typeof window !== "undefined" ? window.location.search.toLowerCase() : "";

  // Dedicated Manager Access detector
  const isManagerMode =
    hostname.includes("nothing-763e") ||
    hostname.includes("prqi0j1") ||
    hostname.includes("git-main") ||
    hostname.includes("admin") ||
    hostname.includes("manager") ||
    search.includes("manager") ||
    search.includes("admin");

  return (
    <Routes>
      {/* Root Route */}
      <Route
        path="/"
        element={isManagerMode ? <AdminLogin /> : <CustomerMenu />}
      />

      {/* Customer Menu direct view */}
      <Route path="/menu" element={<CustomerMenu />} />

      {/* Manager direct routes (shareable links) */}
      <Route path="/manager" element={<AdminLogin />} />
      <Route path="/manager/login" element={<AdminLogin />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/staff" element={<AdminLogin />} />
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
        element={<Navigate to={isManagerMode ? "/admin/login" : "/"} replace />}
      />
    </Routes>
  );
}

export default App;
