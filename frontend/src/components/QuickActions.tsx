import { useState } from "react";
import TransferForm from "./TransferForm.tsx";
import DepositForm from "./DepositForm.tsx";
import WithdrawForm from "./WithdrawForm.tsx";
import { TXN_ENDPOINTS } from "../constants/endpoints.ts";

export default function QuickActions({ refresh }: { refresh: () => void }) {
  const [action, setAction] = useState<
    "transfer" | "deposit" | "withdraw" | null
  >(null);

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="text-sm text-center pb-2 font-semibold text-gray-700 mb-3">
        Quick Actions
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {Object.values(TXN_ENDPOINTS).map((type) => (
          <button
            key={type}
            onClick={() => setAction(type as any)}
            className="rounded-md bg-purple-600 text-white py-1 hover:bg-purple-700 capitalize cursor-pointer"
          >
            {type}
          </button>
        ))}
      </div>

      {/* Modal logic */}
      {action && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setAction(null)}
              className="absolute right-4 top-2 text-purple-500 hover:text-purple-700 cursor-pointer"
            >
              ✕
            </button>

            {action === "deposit" && <DepositForm onSuccess={refresh} />}
            {action === "withdraw" && <WithdrawForm onSuccess={refresh} />}
            {action === "transfer" && <TransferForm onSuccess={refresh} />}
          </div>
        </div>
      )}
    </div>
  );
}
