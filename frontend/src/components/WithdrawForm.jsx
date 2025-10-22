import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../api/apiClient";

const schema = yup.object({
  amount: yup
    .number()
    .typeError("Amount must be a number")
    .positive()
    .required("Amount required")
});

export default function WithdrawForm({ accountId, onDone }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) });
  async function onSubmit(data) {
    await api.post("/api/transactions", {
      fromAccount: accountId,
      amount: Number(data.amount),
      type: "withdraw"
    });
    onDone?.();
  }
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-3 rounded shadow space-y-2"
    >
      {errors.amount && (
        <div className="text-sm text-red-600">{errors.amount.message}</div>
      )}
      <input
        {...register("amount")}
        placeholder="Amount"
        className="w-full border px-2 py-2 rounded"
      />
      <div className="flex justify-end">
        <button
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Withdraw
        </button>
      </div>
    </form>
  );
}
