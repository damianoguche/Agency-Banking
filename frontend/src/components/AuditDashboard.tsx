import { useEffect, useState } from "react";
import axios from "axios";

export default function AuditDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await axios.get(
      "http://localhost:3000/remediation/inconsistencies"
    );
    setRecords(res.data);
    console.log(res.data);
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
              <th className="p-2 border border-gray-300">ID</th>
              <th className="p-2 border border-gray-300">Wallet ID</th>
              <th className="p-2 border border-gray-300">Actual</th>
              <th className="p-2 border border-gray-300">Computed</th>
              <th className="p-2 border border-gray-300">Diff</th>
              <th className="p-2 border border-gray-300">Status</th>
              <th className="p-2 border border-gray-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border border-gray-200">
                <td className="text-center">{r.id}</td>
                <td className="text-center">{r.walletId}</td>
                <td className="text-center">{r.actual_balance}</td>
                <td className="text-center">{r.computed_balance}</td>
                <td
                  className={
                    r.difference > 0
                      ? "text-red-600 text-center"
                      : "text-green-600 text-center"
                  }
                >
                  {r.difference}
                </td>
                <td className="text-center">{r.status}</td>
                <td className="p-1 text-center">
                  {r.status === "inconsistent" ? (
                    <button
                      onClick={() => handleFix(r.id)}
                      className="bg-blue-500 text-white rounded cursor-pointer px-3 py-1 w-30"
                    >
                      Fix & Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFix(r.id)}
                      className="bg-blue-500 text-white rounded cursor-pointer resolved px-3 py-1 w-30"
                    >
                      Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
