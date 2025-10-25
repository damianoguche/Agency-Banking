import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const schema = yup.object({
  amount: yup
    .number()
    .typeError("Enter a valid amount")
    .positive("Amount must be positive")
    .required("Amount is required"),
  source: yup
    .string()
    .required("Funding source is required")
    .oneOf(["bank", "cash", "transfer"], "Invalid source")
});

export default function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const API = import.meta.env.VITE_API_BASE;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/wallet/deposit`, data, { headers });
      toast.success("Deposit successful!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Deposit failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold mb-2 text-gray-700">
        Deposit Funds
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          placeholder="Enter amount"
          className="w-full border rounded-md p-2"
        />
        {errors.amount && (
          <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Funding Source
        </label>
        <select
          {...register("source")}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select source</option>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
        </select>
        {errors.source && (
          <p className="text-red-600 text-xs mt-1">{errors.source.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
      >
        {isSubmitting ? "Processing..." : "Deposit Funds"}
      </button>
    </form>
  );
}
