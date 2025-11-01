import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";
import ResetPinButton from "@/components/ResetPinButton.tsx";
import PinManager from "@/components/PinManager.tsx";
import { Menu, X } from "lucide-react";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-purple-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold text-white">SecureBank</div>
            <nav className="hidden md:flex gap-4">
              <Link to="/" className="text-sm text-white hover:text-purple-200">
                Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-sm text-white hover:text-purple-200"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Greeting + Actions */}
          <div className="flex items-center gap-3 relative">
            {user ? (
              <>
                {/* Greeting stays visible always */}
                <div className="text-sm text-white whitespace-nowrap">
                  Hi, <strong>{user.name}</strong>
                </div>

                {/* Desktop buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={logout}
                    className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>

                {/* Mobile dropdown */}
                <div className="md:hidden relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded text-white hover:bg-purple-700 transition"
                  >
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <div className="px-2 py-1">
                        <PinManager
                          wallet={{
                            walletNumber: user.walletNumber,
                            hasPin: user.hasPin ?? false
                          }}
                        />
                      </div>
                      <div className="px-2 py-1">
                        <ResetPinButton walletNumber={user.walletNumber} />
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
