import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import BalanceCard from "../components/BalanceCard.tsx";
import QuickActions from "../components/QuickActions.tsx";
import TransactionsList from "../components/TransactionsList.tsx";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  description?: string;
}

export default function UserDashboard() {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

  async function fetchData() {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [balanceRes, txnRes] = await Promise.all([
        axios.get(`${API}/wallet/balance`, { headers }),
        axios.get(`${API}/transactions/recent`, { headers })
      ]);
      setBalance(balanceRes.data.balance || 0);
      setTransactions(txnRes.data.transactions || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-600">
        <p>{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Welcome, {user?.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard balance={balance} />
        <QuickActions refresh={fetchData} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Recent Transactions
        </h2>
        <TransactionsList transactions={transactions} />
      </div>
    </div>
  );
}
