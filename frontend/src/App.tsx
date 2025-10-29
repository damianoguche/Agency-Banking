import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { setLogoutHandler } from "./api/axiosInstance";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import EventsPage from "./pages/admin/EventsPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditTrailPage from "./pages/admin/AuditTrailPage";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({
  children,
  role
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-600">
        Loading...
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Wrap AuthProvider inside BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Inner app handles routing and logout wiring
function AppRoutes() {
  const { logout } = useAuth();
  setLogoutHandler(logout);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavBar />
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="registeredUsers" element={<UsersPage />} />
          <Route path="auditTrail" element={<AuditTrailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
