import { useEffect, useState } from "react";
import api from "@/api/axiosInstance";

interface Audit {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export default function AuditTrail() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const API = import.meta.env.VITE_API_BASE;

  async function loadAudits() {
    try {
      const res = await api.get(`${API}/admin/audit`);
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
