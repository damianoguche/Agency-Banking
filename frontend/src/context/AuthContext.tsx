// This keeps track of the logged-in user across your whole app.

import { createContext, useContext, useEffect, useState } from "react";
import {
  getMe,
  loginUser,
  registerUser,
  logoutUser
} from "../services/authService";
import { User } from "@/types/User";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    phone: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Toggle this based on your backend token flow
  const useLocalStorage = true;

  // Called once on app startup
  useEffect(() => {
    const init = async () => {
      try {
        if (useLocalStorage) {
          const savedToken = localStorage.getItem("token");
          if (savedToken) {
            setToken(savedToken);
            // Validate token & fetch user info
            const profile = await getMe(savedToken);
            setUser(profile);
          }
        } else {
          const profile = await getMe(); // httpOnly cookie auto-sent
          setUser(profile);
        }
      } catch (err) {
        console.error("Auth init failed", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      if (useLocalStorage) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }

      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(
    name: string,
    phone: string,
    email: string,
    password: string
  ) {
    setLoading(true);
    try {
      const data = await registerUser(name, phone, email, password);
      if (useLocalStorage) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    if (useLocalStorage) localStorage.removeItem("token");
    logoutUser();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
