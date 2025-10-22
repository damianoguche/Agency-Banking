// import { createContext, useContext, useState, useEffect } from "react";
// import api from "../api/apiClient";

// const AuthContext = createContext();
// export function useAuth() {
//   return useContext(AuthContext);
// }

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   async function loadMe() {
//     try {
//       const res = await api.get("/api/me");
//       setUser(res.data);
//     } catch (err) {
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadMe();
//   }, []);

//   async function loginWithToken(token) {
//     localStorage.setItem("token", token);
//     await loadMe();
//   }

//   function logout() {
//     localStorage.removeItem("token");
//     setUser(null);
//   }

//   return (
//     <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
  const { user, loading, token, login, register, logout } = useAuthContext();
  return { user, loading, token, login, register, logout };
}
