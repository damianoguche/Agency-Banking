import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import BalanceCard from "../components/BalanceCard.tsx";
import QuickActions from "../components/QuickActions.tsx";
import TransactionsList from "../components/TransactionsList.tsx";
import AirtimeRechargeCard from "../components/AirtimeRechargeCard.tsx";
import BillPaymentsCard from "../components/BillPaymentsCard.tsx";
import PinManager from "../components/PinManager.tsx";
import api from "@/api/axiosInstance.ts";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  created_at: string;
  status: "completed" | "pending" | "failed";
  description?: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shouldPromptPin, setShouldPromptPin] = useState(false);

  const limit = 6;
  const API = import.meta.env.VITE_API_BASE;
  console.log(user);

  // Fetching User Data
  async function fetchData() {
    if (!user?.walletNumber) return;

    setLoading(true);
    setError(null);

    try {
      const [balanceRes, txnRes] = await Promise.all([
        api.get(`${API}/customers/${user.walletNumber}/balance`),
        api.get(
          `${API}/transactions/${user.walletNumber}/recentTransactions?page=${page}&limit=${limit}`
        )
      ]);

      setBalance(balanceRes.data.balance || 0);
      setTransactions(txnRes.data.transactions || []);

      if (txnRes.data.count) {
        setTotalPages(Math.ceil(txnRes.data.count / limit));
      } else {
        setTotalPages(
          page + (txnRes.data.transactions?.length === limit ? 1 : 0)
        );
      }
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    fetchData();
  }, [page]);

  // Onboarding check – prompt if PIN missing
  useEffect(() => {
    if (user && user.hasPin === false) {
      toast("Please set your transaction PIN.", { icon: "🔐", duration: 3000 });
      setShouldPromptPin(true);
    } else {
      setShouldPromptPin(false);
    }
  }, [user?.hasPin]);

  // --- UI Rendering ---
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
          className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center md:text-left">
          Welcome, {user?.name}
        </h1>

        {/* PIN Management */}
        <div className="flex justify-center md:justify-end mb-6">
          <PinManager
            wallet={{
              walletNumber: user?.walletNumber || "",
              hasPin: user?.hasPin ?? false
            }}
            autoOpen={shouldPromptPin}
          />
        </div>

        {/* Balance + Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          <div className="w-full max-w-sm">
            <BalanceCard balance={balance} />
          </div>
          <div className="w-full max-w-sm">
            <QuickActions refresh={fetchData} />
          </div>
          <div className="w-full max-w-sm">
            <AirtimeRechargeCard refresh={fetchData} />
          </div>
          <div className="w-full max-w-sm">
            <BillPaymentsCard refresh={fetchData} />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 text-center md:text-left">
            Recent Transactions
          </h2>

          <TransactionsList transactions={transactions} />

          {/*Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 cursor-pointer rounded-lg text-sm border transition ${
                page === 1
                  ? "bg-purple-100 text-purple-400 cursor-not-allowed"
                  : "bg-purple-200 hover:bg-purple-300"
              }`}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1.5 cursor-pointer rounded-lg text-sm transition ${
                  num === page
                    ? "bg-purple-600 text-white font-semibold"
                    : "bg-purple-200 hover:bg-purple-300"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < limit}
              className={`px-3 py-1.5 rounded-lg cursor-pointer text-sm border transition ${
                transactions.length < limit
                  ? "bg-purple-100 text-purple-400 cursor-not-allowed"
                  : "bg-purple-200 hover:bg-purple-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
