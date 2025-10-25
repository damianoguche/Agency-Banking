import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const schema = yup.object({
  destinationWallet: yup
    .string()
    .required("Destination wallet number is required"),
  amount: yup
    .number()
    .positive("Amount must be positive")
    .required("Amount is required"),
  note: yup.string().max(100, "Note too long").optional()
});

export default function TransferForm({ onSuccess }: { onSuccess: () => void }) {
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
      await axios.post(`${API}/wallet/transfer`, data, { headers });
      toast.success("Transfer successful!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold mb-2 text-gray-700">
        Transfer Funds
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Destination Wallet
        </label>
        <input
          {...register("destinationWallet")}
          placeholder="Enter wallet number"
          className="w-full border rounded-md p-2"
        />
        {errors.destinationWallet && (
          <p className="text-red-600 text-xs mt-1">
            {errors.destinationWallet.message}
          </p>
        )}
      </div>

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
          Note (optional)
        </label>
        <input
          {...register("note")}
          placeholder="For reference..."
          className="w-full border rounded-md p-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
      >
        {isSubmitting ? "Processing..." : "Send Transfer"}
      </button>
    </form>
  );
}
