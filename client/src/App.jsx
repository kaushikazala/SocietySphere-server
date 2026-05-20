import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import "./styles/global.css";

// Pages
import LandingPage from "./pages/Landing";
import AuthPage from "./pages/Auth";
import ResidentDashboard from "./pages/ResidentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GuardDashboard from "./pages/GuardDashboard";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import CreateSociety from "./pages/CreateSociety";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth?mode=login" />;
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) return <Navigate to="/dashboard" />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth?mode=login" />;

  switch (user.role) {
    case "super_admin":
    case "admin":
      return <AdminDashboard user={user} />;
    case "maintenance":
      return <MaintenanceDashboard user={user} />;
    case "resident":
      return <ResidentDashboard user={user} />;
    case "guard":
      return <GuardDashboard user={user} />;
    default:
      return <Navigate to="/" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/societies/new"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <CreateSociety />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
