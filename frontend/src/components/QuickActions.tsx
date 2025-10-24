import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import toast from "react-hot-toast";

export default function QuickActions({ refresh }: { refresh: () => void }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_TX_API_BASE;

  async function handleAction(type: "deposit" | "withdraw" | "transfer") {
    if (!amount) return toast.error("Enter an amount");

    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API}/${type}`,
        { amount: parseFloat(amount) },
        { headers }
      );

      toast.success(`${type} successful`);
      setAmount("");
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `${type} failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Quick Actions
      </h3>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded-md p-2 mb-4"
      />

      <div className="grid grid-cols-3 gap-2">
        {["deposit", "withdraw", "transfer"].map((type) => (
          <button
            key={type}
            disabled={loading}
            onClick={() => handleAction(type as any)}
            className="rounded-md bg-purple-600 text-white py-2 hover:bg-purple-800 disabled:opacity-60 capitalize cursor-pointer"
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
