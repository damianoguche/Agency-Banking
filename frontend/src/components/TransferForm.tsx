import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { PinModal } from "./PinModal";
import { useState } from "react";

const schema = yup.object({
  receiverWalletNumber: yup
    .string()
    .required("Destination wallet number is required"),
  amount: yup
    .number()
    .positive("Amount must be positive")
    .required("Amount is required"),
  narration: yup.string().max(100, "Note too long").optional()
});

export default function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const API = import.meta.env.VITE_TX_API_BASE;
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

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
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/transfer`, { ...pendingData, pin }, { headers });
      toast.success("Transfer successful!");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    }
  };

  // const onSubmit = async (data: any) => {
  //   try {
  //     const headers = { Authorization: `Bearer ${token}` };
  //     await axios.post(`${API}/transfer`, data, { headers });
  //     toast.success("Transfer successful!");
  //     reset();
  //     onSuccess();
  //   } catch (err: any) {
  //     toast.error(err?.response?.data?.message);
  //   }
  // };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 w-full max-w-sm mx-auto bg-white shadow-sm border border-gray-100 p-6 rounded-2xl"
      >
        <h2 className="text-lg font-semibold mb-2 text-gray-700 text-center">
          Transfer Funds
        </h2>

        {/* Destination Wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Wallet
          </label>
          <input
            {...register("receiverWalletNumber")}
            placeholder="Enter wallet number"
            className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {errors.receiverWalletNumber && (
            <p className="text-red-600 text-xs mt-1">
              {errors.receiverWalletNumber.message}
            </p>
          )}
        </div>

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

        {/* Note (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <input
            {...register("narration")}
            placeholder="For reference..."
            className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? "Processing..." : "Send Transfer"}
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
