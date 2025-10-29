import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";

const API_BASE = import.meta.env.VITE_API_BASE;

// Create a single axios instance for the app
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

let logoutFn: (() => void) | null = null;

// Allow App.tsx (after AuthProvider is mounted) to register logout
export const setLogoutHandler = (fn: () => void) => {
  logoutFn = fn;
};

// Automatically add Authorization header before every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Check if JWT is expired before sending the request
    if (isTokenExpired(token)) {
      logoutFn?.(); // logout immediately
      throw new axios.Cancel("Token expired");
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired or invalid tokens from backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 Unauthorized, trigger logout
    if (error.response && error.response.status === 401) {
      console.warn("API returned 401 — logging out user");
      logoutFn?.();
    }

    // Always reject so that calling code can still catch it
    return Promise.reject(error);
  }
);

export default api;
