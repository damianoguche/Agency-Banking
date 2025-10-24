import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import toast from "react-hot-toast";
import SystemEvents from "../components/admin/SystemEvents";
import UsersList from "../components/admin/UsersList";
import AuditTrail from "../components/admin/AuditTrail";

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  joinedAt: string;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_BASE;

  async function loadData() {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eventRes, userRes] = await Promise.all([
        axios.get(`${API}/admin/events`, { headers }),
        axios.get(`${API}/admin/customers`, { headers })
      ]);
      setEvents(eventRes.data.events || []);
      setUsers(userRes.data.users || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") {
      toast.error("Access denied: Admins only");
      return;
    }
    loadData();
  }, [user]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading Admin Dashboard...
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-600">
        <p>{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SystemEvents events={events} />
        <UsersList users={users} refresh={loadData} />
      </div>

      <div className="mt-10">
        <AuditTrail />
      </div>
    </div>
  );
}
