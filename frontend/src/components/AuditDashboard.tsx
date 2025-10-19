import { useEffect, useState } from "react";
import axios from "axios";

export default function AuditDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(false);
    const res = await axios.get(
      "http://localhost:3000/remediation/inconsistencies"
    );
    setRecords(res.data);
    setLoading(false);
  }

  async function handleFix(id: number) {
    await axios.post(`http://localhost:3000/remediation/${id}/fix`, {
      reviewer: "ITRiskOps"
    });
    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Ledger Inconsistencies</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Wallet ID</th>
              <th className="p-2 border">Actual</th>
              <th className="p-2 border">Computed</th>
              <th className="p-2 border">Diff</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b">
                <td>{r.id}</td>
                <td>{r.walletId}</td>
                <td>{r.actualBalance}</td>
                <td>{r.computedBalance}</td>
                <td
                  className={
                    r.difference > 0 ? "text-red-600" : "text-green-600"
                  }
                >
                  {r.difference}
                </td>
                <td>
                  <button
                    onClick={() => handleFix(r.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Fix & Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
