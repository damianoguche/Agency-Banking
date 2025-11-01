import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import api from "@/api/axiosInstance.ts";

interface ResetPinButtonProps {
  walletNumber: string;
  onResetComplete?: () => void;
}

export default function ResetPinButton({ walletNumber }: ResetPinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const API = import.meta.env.VITE_API_BASE;

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.post(`${API}/wallet/${walletNumber}/reset-pin`);
      toast.success("PIN reset successful! Please set a new PIN.");
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "PIN reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-purple-500 text-purple-600 hover:bg-purple-100 cursor-pointer"
        >
          Reset PIN
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm w-96 rounded-xl bg-white text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Reset Transaction PIN
        </h2>
        <p className="text-gray-700 text-md mb-4">
          Are you sure you want to reset your PIN? You’ll need to set a new one
          afterward.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-100 bg-gray-500 hover:bg-gray-800 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            {loading ? "Resetting..." : "Confirm Reset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
