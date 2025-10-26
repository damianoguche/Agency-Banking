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
  pin: yup
    .string()
    .required("PIN is required")
    .matches(/^[0-9]{4}$/, "PIN must be a 4-digit number")
});

export default function WithdrawForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const API = import.meta.env.VITE_TX_API_BASE;

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
      await axios.post(`${API}/withdraw`, data, { headers });
      toast.success("Withdrawal successful!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Withdrawal failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-sm mx-auto bg-white shadow-sm border border-gray-100 p-6 rounded-2xl"
    >
      <h2 className="text-lg font-semibold mb-2 text-gray-700 text-center">
        Withdraw Funds
      </h2>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          placeholder="Enter amount"
          className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.amount && (
          <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* PIN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wallet PIN
        </label>
        <input
          {...register("pin")}
          type="password"
          maxLength={4}
          placeholder="Enter 4-digit PIN"
          className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.pin && (
          <p className="text-red-600 text-xs mt-1">{errors.pin.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60"
      >
        {isSubmitting ? "Processing..." : "Withdraw Funds"}
      </button>
    </form>
  );
}
