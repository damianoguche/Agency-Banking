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

  const CxAPI = import.meta.env.VITE_CX_API_BASE;
  const TxAPI = import.meta.env.VITE_TX_API_BASE;

  async function fetchData() {
    if (!user?.walletNumber) {
      console.warn("No wallet number yet — skipping fetch");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [balanceRes, txnRes] = await Promise.all([
          axios.get(`${CxAPI}/${user?.walletNumber}/balance`, { headers }),
          axios.get(`${TxAPI}/${user?.walletNumber}/recentTransactions`, {
            headers
          })
          //axios.get(`${TxAPI}/me`, { headers })
        ]);

        setBalance(balanceRes.data.balance || 0);
        setTransactions(txnRes.data.transactions || []);
      } catch (error) {
        console.log(error);
      }
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
