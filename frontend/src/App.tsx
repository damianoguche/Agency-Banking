// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast";
// import { AuthProvider } from "./context/AuthContext.tsx";
// import Login from "./pages/Login.tsx";
// import Register from "./pages/Register.tsx";
// import UserDashboard from "./pages/UserDashboard.tsx";
// import AdminDashboard from "./pages/AdminDashboard.tsx";
// import NavBar from "./components/NavBar.tsx";
// import { useAuth } from "./hooks/useAuth.tsx";

// /**
//  * AuthProvider wraps your routes and how /me initializes your session
//  * automatically.
//  * Protected route wrapper with role-based access control
//  * */

// function ProtectedRoute({
//   children,
//   role
// }: {
//   children: React.ReactNode;
//   role?: string;
// }) {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen text-lg text-gray-600">
//         Loading...
//       </div>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;
//   if (role && user.role !== role) return <Navigate to="/" replace />;

//   return <>{children}</>;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <div className="min-h-screen bg-gray-50 text-gray-900">
//           <NavBar />
//           <Toaster position="top-right" />

//           <Routes>
//             {/* Default redirect */}
//             <Route path="/" element={<Navigate to="/dashboard" replace />} />

//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />

//             <Route
//               path="/dashboard"
//               element={
//                 <ProtectedRoute>
//                   <UserDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/admin"
//               element={
//                 <ProtectedRoute role="admin">
//                   <AdminDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Fallback */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </div>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.tsx";
import { useAuth } from "./hooks/useAuth.tsx";

import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import UserDashboard from "./pages/UserDashboard.tsx";
import NavBar from "./components/NavBar.tsx";

// 🆕 Admin layout + pages
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import EventsPage from "./pages/admin/EventsPage.tsx";
import UsersPage from "./pages/admin/UsersPage.tsx";
import AuditTrailPage from "./pages/admin/AuditTrailPage.tsx";

/**
 * ProtectedRoute
 * Handles authentication and role-based access
 */
function ProtectedRoute({
  children,
  role
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-600">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          {/* Global UI elements */}
          <NavBar />
          <Toaster position="top-right" />

          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* 🆕 Admin layout with nested routes */}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
