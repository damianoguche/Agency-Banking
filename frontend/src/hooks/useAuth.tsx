import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
  const { user, setUser, loading, token, login, register, logout } =
    useAuthContext();
  return { user, setUser, loading, token, login, register, logout };
}
