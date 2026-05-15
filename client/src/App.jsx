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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth?mode=login" />;
};

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth?mode=login" />;

  switch (user.role) {
    case "super_admin":
    case "admin":
      return <AdminDashboard user={user} />;
    case "maintenance":
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
