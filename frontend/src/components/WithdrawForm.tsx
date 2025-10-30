import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { PinModal } from "./PinModal";
import api from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";

// Validation Schema
const schema = yup.object({
  amount: yup
    .number()
    .typeError("Enter a valid amount")
    .positive("Amount must be positive")
    .required("Amount is required"),
  narration: yup.string().max(100, "Note too long").optional()
});

export default function WithdrawForm({ onSuccess }: { onSuccess: () => void }) {
  const API = import.meta.env.VITE_API_BASE;

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema)
  });

  // Open modal before sending request
  const handleFormSubmit = (data: any) => {
    if (!user?.hasPin) {
      toast.error("Please set a transaction PIN");
      return;
    }
    setPendingData(data);
    setIsPinModalOpen(true);
  };

  // Confirm PIN and send transaction
  const handlePinConfirm = async (pin: string) => {
    setIsPinModalOpen(false);

    if (!pin || pin.length !== 4) {
      toast.error("Please enter a valid 4-digit PIN");
      return;
    }

    try {
      await api.post(`${API}/transactions/withdraw`, { ...pendingData, pin });
      toast.success("Withdrawal successful!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Withdrawal failed");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 w-full max-w-sm mx-auto bg-white shadow-sm border border-gray-100 p-6 rounded-2xl"
      >
        <h2 className="text-lg font-semibold mb-2 text-gray-700 text-center">
          Withdraw Funds
        </h2>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Narration (Optional)
          </label>
          <input
            {...register("narration")}
            type="text"
            placeholder="Enter narration"
            className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {errors.narration && (
            <p className="text-red-600 text-xs mt-1">
              {errors.narration.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? "Processing..." : "Withdraw Funds"}
        </button>
      </form>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinConfirm}
      />
    </>
  );
}
