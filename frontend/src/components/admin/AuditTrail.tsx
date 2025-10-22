import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

interface Audit {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export default function AuditTrail() {
  const { token } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

  async function loadAudits() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/admin/audit`, { headers });
      setAudits(res.data.audits || []);
    } catch (err) {
      console.error("Failed to load audit trail", err);
    }
  }

  useEffect(() => {
    loadAudits();
  }, []);

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Audit Trail</h3>
      <ul className="space-y-3 max-h-[400px] overflow-y-auto">
        {audits.map((a) => (
          <li key={a.id} className="border-b pb-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">{a.actor}</span> {a.action}{" "}
              <span className="font-medium">{a.target}</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(a.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
        {!audits.length && (
          <p className="text-gray-500 text-sm">No audit records yet.</p>
        )}
      </ul>
    </div>
  );
}
