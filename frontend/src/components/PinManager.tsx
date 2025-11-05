import { useEffect, useState } from "react";
import SetPinForm from "./SetPinForm.tsx";
import ChangePinForm from "./ChangePinForm.tsx";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PinManagerProps {
  wallet: {
    walletNumber: string;
    hasPin: boolean;
  };
  autoOpen?: boolean;
  onModalToggle?: (open: boolean) => void; // Notify parent when modal opens/closes
}

export default function PinManager({
  wallet,
  autoOpen = false,
  onModalToggle
}: PinManagerProps) {
  const [open, setOpen] = useState(autoOpen);
  const [walletState, setWalletState] = useState(wallet);

  // Notify Navbar when dialog opens/closes
  useEffect(() => {
    onModalToggle?.(open);
  }, [open, onModalToggle]);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    setWalletState(wallet);
  }, [wallet]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-500 text-purple-600 hover:bg-purple-100 rounded-lg cursor-pointer"
        >
          {walletState.hasPin ? "Change PIN" : "Set PIN"}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-md bg-white w-96"
        onClick={(e) => e.stopPropagation()} // 🔹 Prevent clicks inside from being treated as outside
      >
        {walletState.hasPin ? (
          <ChangePinForm
            walletNumber={walletState.walletNumber}
            onSuccess={() => setOpen(false)}
          />
        ) : (
          <SetPinForm
            walletNumber={walletState.walletNumber}
            onSuccess={() => {
              setOpen(false);
              setWalletState((prev) => ({ ...prev, hasPin: true }));
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
