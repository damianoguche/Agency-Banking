import api from "@/api/axiosInstance";

const API = import.meta.env.VITE_API_BASE;

export async function loginUser(email: string, password: string) {
  const res = await api.post(`${API}/customers/login`, { email, password });

  return res.data; // expected { token, user }
}

export async function registerUser(
  name: string,
  phone: string,
  email: string,
  password: string
) {
  const res = await api.post(`${API}/customers/register`, {
    fullName: name,
    phoneNumber: phone,
    email,
    password
  });

  return res.data; // expected { token, user }
}

export async function getMe(token?: string) {
  // Optional token override for initial load
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const res = await api.get(`${API}/customers/me`, config);
  return res.data; // expected { id, name, email, role, hasPin }
}

export async function logoutUser() {
  try {
    await api.post(`${API}/customers/logout`, {});
  } catch (e) {
    console.warn("Logout failed (ignored):", e);
  }
}
