import { useEffect, useState } from "react";
import axios from "axios";
import SystemEvents from "../../components/admin/SystemEvents";
import type { SystemEvent } from "@/types/SystemEvent";

export default function EventsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const API = import.meta.env.VITE_ADM_API_BASE;

  const fetchEvents = async () => {
    const res = await axios.get(`${API}/events`);
    const data = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.events)
      ? res.data.events
      : [];
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
