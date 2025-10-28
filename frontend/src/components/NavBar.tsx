import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="bg-purple-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold text-white">SecureBank</div>
            <nav className="hidden md:flex gap-4">
              <Link to="/" className="text-sm text-white">
                Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="text-sm text-white">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-white">
                  Hi, <strong>{user.name}</strong>
                </div>
                <button
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                  className="px-3 py-1 border rounded text-white cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-1 border rounded text-white">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
