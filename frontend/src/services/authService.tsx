import axios from "axios";

const API = import.meta.env.VITE_CX_API_BASE;

export async function loginUser(email: string, password: string) {
  const res = await axios.post(`${API}/login`, { email, password });
  return res.data; // expected { token, user }
}

export async function registerUser(
  name: string,
  phone: string,
  email: string,
  password: string
) {
  const res = await axios.post(`${API}/register`, {
    fullName: name,
    phoneNumber: phone,
    email,
    password
  });

  return res.data; // expected { token, user }
}

export async function getMe(token?: string) {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const res = await axios.get(`${API}/me`, config);

  return res.data; // expected { id, name, email, role }
}

export async function logoutUser() {
  const token = localStorage.getItem("token");
  try {
    await axios.post(
      `${API}/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch (e) {
    console.warn("Logout failed (ignored):", e);
  }
}
