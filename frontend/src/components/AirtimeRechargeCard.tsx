import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

interface AirtimeForm {
  phone: string;
  amount: number;
  network: string;
}

export default function AirtimeRechargeCard({
  refresh
}: {
  refresh: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<AirtimeForm>();
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_BASE;

  const { token } = useAuth();

  const onSubmit = async (data: AirtimeForm) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/transactions/airtime/recharge`, data, {
        headers
      });
      toast.success("Airtime recharge successful!");
      refresh();
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Recharge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-between min-h-[200px]">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Airtime Recharge
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-2"
      >
        <input
          {...register("phone", { required: true })}
          type="tel"
          placeholder="Phone number"
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          {...register("network", { required: true })}
          className="w-full border border-purple-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">Select network</option>
          <option value="MTN">MTN</option>
          <option value="Airtel">Airtel</option>
          <option value="Glo">Glo</option>
          <option value="9mobile">9mobile</option>
        </select>

        <input
          {...register("amount", { required: true, valueAsNumber: true })}
          type="number"
          placeholder="Amount"
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white text-sm py-1.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 mt-1 cursor-pointer"
        >
          {loading ? "Processing..." : "Recharge"}
        </button>
      </form>
    </div>
  );
}
