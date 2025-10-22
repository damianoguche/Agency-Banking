import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
  const { user, loading, token, login, register, logout } = useAuthContext();
  return { user, loading, token, login, register, logout };
}
