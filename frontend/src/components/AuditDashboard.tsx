import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// Define a clear interface
interface AuditRecord {
  id: number;
  walletId: number;
  actual_balance: number;
  computed_balance: number;
  difference: number;
  status: "consistent" | "inconsistent";
}

// Create an Axios instance (best practice)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json"
  }
});

export default function AuditDashboard() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/remediation/inconsistencies");
      setRecords(res.data);
    } catch (err: any) {
      setError("Failed to load data. Please try again.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle fix
  const handleFix = async (id: number) => {
    console.log(id);
    setActionLoading(id);
    try {
      await api.post(`/remediation/${id}/fix`, { reviewer: "ITRiskOps" });
      await loadData();
    } catch (err: any) {
      console.error("Error fixing record:", err);
      alert("Failed to fix record. Please retry.");
    } finally {
      setActionLoading(null);
    }
  };

  // Run on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // UI
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Ledger Inconsistencies
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">No inconsistencies found 🎉</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border border-gray-200 text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                {[
                  "ID",
                  "Wallet",
                  "Actual",
                  "Computed",
                  "Diff",
                  "Status",
                  "Action"
                ].map((h) => (
                  <th
                    key={h}
                    className="p-2 border border-gray-200 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border border-gray-200 hover:bg-gray-50"
                >
                  <td className="text-center p-2">{r.id}</td>
                  <td className="text-center p-2">{r.walletId}</td>
                  <td className="text-center p-2">{r.actual_balance}</td>
                  <td className="text-center p-2">{r.computed_balance}</td>
                  <td
                    className={`text-center p-2 font-medium ${
                      r.difference !== 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {Number(r.difference || 0).toFixed(2)}
                  </td>
                  <td
                    className={`text-center p-2 capitalize ${
                      r.status === "inconsistent"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {r.status}
                  </td>
                  <td className="text-center p-2">
                    <button
                      disabled={actionLoading === r.id}
                      onClick={() => handleFix(r.walletId)}
                      className={`px-3 py-1 rounded-md text-white text-sm transition-colors w-28 ${
                        r.status === "inconsistent"
                          ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                          : "bg-green-400 cursor-not-allowed"
                      } ${actionLoading === r.id ? "opacity-60" : ""}`}
                    >
                      {actionLoading === r.id
                        ? "Processing..."
                        : r.status === "inconsistent"
                        ? "Fix & Resolve"
                        : "Resolved"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
