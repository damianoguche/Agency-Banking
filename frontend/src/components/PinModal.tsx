import { useState } from "react";

export function PinModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          Enter Wallet PIN
        </h2>
        <input
          type="password"
          value={pin}
          maxLength={4}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="w-full border border-purple-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-4 py-2 hover:text-white text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(pin)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
