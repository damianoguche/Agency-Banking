import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../api/apiClient";

const schema = yup.object({
  toAccount: yup.string().required("Destination account is required"),
  amount: yup
    .number()
    .typeError("Amount must be a number")
    .positive()
    .required("Amount required"),
  narration: yup.string().nullable()
});

export default function TransferForm({ accountId, onDone }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(data) {
    await api.post("/api/transactions", {
      fromAccount: accountId,
      toAccount: data.toAccount,
      amount: Number(data.amount),
      type: "transfer",
      narration: data.narration
    });
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-3 rounded shadow space-y-2"
    >
      {errors.toAccount && (
        <div className="text-sm text-red-600">{errors.toAccount.message}</div>
      )}
      <input
        {...register("toAccount")}
        placeholder="Destination account"
        className="w-full border px-2 py-2 rounded"
      />
      {errors.amount && (
        <div className="text-sm text-red-600">{errors.amount.message}</div>
      )}
      <input
        {...register("amount")}
        placeholder="Amount"
        className="w-full border px-2 py-2 rounded"
      />
      <input
        {...register("narration")}
        placeholder="Narration"
        className="w-full border px-2 py-2 rounded"
      />
      <div className="flex justify-end">
        <button
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </form>
  );
}
