// import { useEffect, useState } from "react";
// import { useAuth } from "../hooks/useAuth";
// import axios from "axios";
// import BalanceCard from "../components/BalanceCard.tsx";
// import QuickActions from "../components/QuickActions.tsx";
// import TransactionsList from "../components/TransactionsList.tsx";
// import AirtimeRechargeCard from "../components/AirtimeRechargeCard.tsx";
// import BillPaymentsCard from "../components/BillPaymentsCard.tsx";

// interface Transaction {
//   id: string;
//   type: "deposit" | "withdrawal" | "transfer";
//   amount: number;
//   created_at: string;
//   status: "completed" | "pending" | "failed";
//   description?: string;
// }

// export default function UserDashboard() {
//   const { user, token } = useAuth();
//   const [balance, setBalance] = useState<number>(0);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   console.log(transactions);

//   const CxAPI = import.meta.env.VITE_CX_API_BASE;
//   const TxAPI = import.meta.env.VITE_TX_API_BASE;

//   async function fetchData() {
//     if (!user?.walletNumber) {
//       console.warn("No wallet number yet — skipping fetch");
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);

//     try {
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};
//       const [balanceRes, txnRes] = await Promise.all([
//         axios.get(`${CxAPI}/${user?.walletNumber}/balance`, { headers }),
//         axios.get(
//           `${TxAPI}/${user?.walletNumber}/recentTransactions?page=1&limit=6`,
//           {
//             headers
//           }
//         )
//       ]);

//       setBalance(balanceRes.data.balance || 0);
//       setTransactions(txnRes.data.transactions || []);
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center text-gray-600">
//         Loading dashboard...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex h-screen flex-col items-center justify-center text-red-600">
//         <p>{error}</p>
//         <button
//           onClick={fetchData}
//           className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition"
//         >
//           Retry
//         </button>
//       </div>
//     );

//   return (
//     <div className="p-4 md:p-8 flex flex-col items-center">
//       <div className="w-full max-w-5xl">
//         <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left">
//           Welcome, {user?.name}
//         </h1>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
//           <div className="w-full max-w-sm">
//             <BalanceCard balance={balance} />
//           </div>
//           <div className="w-full max-w-sm">
//             <QuickActions refresh={fetchData} />
//           </div>
//           <div className="w-full max-w-sm">
//             <AirtimeRechargeCard refresh={fetchData} />
//           </div>
//           <div className="w-full max-w-sm">
//             <BillPaymentsCard refresh={fetchData} />
//           </div>
//         </div>

//         <div className="mt-10">
//           <h2 className="text-lg font-semibold mb-3 text-gray-700 text-center md:text-left">
//             Recent Transactions
//           </h2>
//           <TransactionsList transactions={transactions} />
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { useAuth } from "../hooks/useAuth";
// import axios from "axios";
// import BalanceCard from "../components/BalanceCard.tsx";
// import QuickActions from "../components/QuickActions.tsx";
// import TransactionsList from "../components/TransactionsList.tsx";
// import AirtimeRechargeCard from "../components/AirtimeRechargeCard.tsx";
// import BillPaymentsCard from "../components/BillPaymentsCard.tsx";

// interface Transaction {
//   id: string;
//   type: "deposit" | "withdrawal" | "transfer";
//   amount: number;
//   created_at: string;
//   status: "completed" | "pending" | "failed";
//   description?: string;
// }

// export default function UserDashboard() {
//   const { user, token } = useAuth();
//   const [balance, setBalance] = useState<number>(0);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);

//   const limit = 6;
//   const CxAPI = import.meta.env.VITE_CX_API_BASE;
//   const TxAPI = import.meta.env.VITE_TX_API_BASE;

//   async function fetchData() {
//     if (!user?.walletNumber) {
//       console.warn("No wallet number yet — skipping fetch");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};

//       const [balanceRes, txnRes] = await Promise.all([
//         axios.get(`${CxAPI}/${user.walletNumber}/balance`, { headers }),
//         axios.get(
//           `${TxAPI}/${user.walletNumber}/recentTransactions?page=${page}&limit=${limit}`,
//           { headers }
//         )
//       ]);

//       setBalance(balanceRes.data.balance || 0);
//       setTransactions(txnRes.data.transactions || []);
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Refetch whenever page changes
//   useEffect(() => {
//     fetchData();
//   }, [page]);

//   if (loading)
//     return (
//       <div className="flex h-screen items-center justify-center text-gray-600">
//         Loading dashboard...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex h-screen flex-col items-center justify-center text-red-600">
//         <p>{error}</p>
//         <button
//           onClick={fetchData}
//           className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition"
//         >
//           Retry
//         </button>
//       </div>
//     );

//   return (
//     <div className="p-4 md:p-8 flex flex-col items-center">
//       <div className="w-full max-w-5xl">
//         <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left">
//           Welcome, {user?.name}
//         </h1>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
//           <div className="w-full max-w-sm">
//             <BalanceCard balance={balance} />
//           </div>
//           <div className="w-full max-w-sm">
//             <QuickActions refresh={fetchData} />
//           </div>
//           <div className="w-full max-w-sm">
//             <AirtimeRechargeCard refresh={fetchData} />
//           </div>
//           <div className="w-full max-w-sm">
//             <BillPaymentsCard refresh={fetchData} />
//           </div>
//         </div>

//         <div className="mt-10">
//           <h2 className="text-lg font-semibold mb-3 text-gray-700 text-center md:text-left">
//             Recent Transactions
//           </h2>

//           <TransactionsList transactions={transactions} />

//           {/*Pagination Controls */}
//           <div className="flex justify-center gap-4 mt-6">
//             <button
//               disabled={page === 1}
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               className={`px-4 py-1 cursor-pointer rounded-lg border text-sm transition ${
//                 page === 1
//                   ? "opacity-50 cursor-not-allowed bg-purple-100"
//                   : "bg-purple-200 hover:bg-purple-300"
//               }`}
//             >
//               Previous
//             </button>

//             <span className="px-3 py-2 text-gray-700 font-medium">
//               Page {page}
//             </span>

//             <button
//               disabled={transactions.length < limit}
//               onClick={() => setPage((p) => p + 1)}
//               className={`px-4 py-1 rounded-lg border text-sm transition ${
//                 transactions.length < limit
//                   ? "opacity-50 cursor-not-allowed bg-purple-100"
//                   : "bg-purple-200 hover:bg-purple-300"
//               }`}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import BalanceCard from "../components/BalanceCard.tsx";
import QuickActions from "../components/QuickActions.tsx";
import TransactionsList from "../components/TransactionsList.tsx";
import AirtimeRechargeCard from "../components/AirtimeRechargeCard.tsx";
import BillPaymentsCard from "../components/BillPaymentsCard.tsx";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  created_at: string;
  status: "completed" | "pending" | "failed";
  description?: string;
}

export default function UserDashboard() {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  const CxAPI = import.meta.env.VITE_CX_API_BASE;
  const TxAPI = import.meta.env.VITE_TX_API_BASE;

  async function fetchData() {
    if (!user?.walletNumber) return;

    setLoading(true);
    setError(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [balanceRes, txnRes] = await Promise.all([
        axios.get(`${CxAPI}/${user.walletNumber}/balance`, { headers }),
        axios.get(
          `${TxAPI}/${user.walletNumber}/recentTransactions?page=${page}&limit=${limit}`,
          { headers }
        )
      ]);

      setBalance(balanceRes.data.balance || 0);
      setTransactions(txnRes.data.transactions || []);

      // Optional: if backend includes total count, compute total pages
      if (txnRes.data.count) {
        setTotalPages(Math.ceil(txnRes.data.count / limit));
      } else {
        // fallback: if no count, just handle next/prev based on data length
        setTotalPages(
          page + (txnRes.data.transactions?.length === limit ? 1 : 0)
        );
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
  }, [page]);

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
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left">
          Welcome, {user?.name}
        </h1>

        {/* Cards */}
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

        {/* Transactions */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 text-center md:text-left">
            Recent Transactions
          </h2>

          <TransactionsList transactions={transactions} />

          {/* 🔹 Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
            {/* Previous */}
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

            {/* Numbered Pages */}
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

            {/* Next */}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < limit}
              className={`px-3 py-1.5 rounded-lg text-sm border transition cursor-pointer ${
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
