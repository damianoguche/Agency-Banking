import { useEffect, useState } from "react";
import axios from "axios";
import SystemEvents from "../../components/admin/SystemEvents";
import type { SystemEvent } from "@/types/SystemEvent";
import { useAuth } from "@/hooks/useAuth";

export default function EventsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const API = import.meta.env.VITE_API_BASE;
  const { token } = useAuth();

  const fetchEvents = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.get(`${API}/admin/events`, { headers });
    const data = Array.isArray(res.data.events) ? res.data.events : [];
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">System Events</h1>
      <SystemEvents events={events} />
    </div>
  );
}
