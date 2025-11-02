import api from "@/api/axiosInstance";

export async function loginUser(email: string, password: string) {
  const res = await api.post(`/customers/login`, { email, password });

  return res.data; // expected { token, user }
}

export async function registerUser(
  name: string,
  phone: string,
  email: string,
  password: string
) {
  const res = await api.post(`/customers/register`, {
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
  const res = await api.get(`/customers/me`, config);
  return res.data; // expected { id, name, email, role, hasPin }
}

export async function logoutUser() {
  try {
    await api.post(`/customers/logout`, {});
  } catch (e) {
    console.warn("Logout failed (ignored):", e);
  }
}
