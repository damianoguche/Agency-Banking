import axios from "axios";
import { getToken, removeToken, isTokenExpired } from "../utils/tokenUtils";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

let logoutFn: (() => void) | null = null;
let hasShownToast = false;

// Allow App.tsx (after AuthProvider mounts) to register logout
export const setLogoutHandler = (fn: () => void) => {
  logoutFn = fn;
};

// REQUEST INTERCEPTOR — check token before sending
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      if (isTokenExpired(token)) {
        console.warn("Token expired — logging out");
        logoutFn?.();
        removeToken();

        if (!hasShownToast) {
          toast.error("Session expired — please log in again.");
          hasShownToast = true;
          setTimeout(() => (hasShownToast = false), 4000);
        }

        // Standard error so UI can catch it (instead of axios.Cancel)
        return Promise.reject({
          isExpiredToken: true,
          message: "Session expired — please log in again."
        });
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — handle backend 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API returned 401 — logging out user");
      logoutFn?.();

      if (!hasShownToast) {
        toast.error("Session expired — please log in again.");
        hasShownToast = true;
        setTimeout(() => (hasShownToast = false), 4000);
      }

      error.isExpiredToken = true;
      error.message = "Session expired — please log in again.";
    }

    return Promise.reject(error);
  }
);

export default api;
