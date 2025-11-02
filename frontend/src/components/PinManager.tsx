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
}

export default function PinManager({
  wallet,
  autoOpen = false
}: PinManagerProps) {
  const [open, setOpen] = useState(autoOpen);
  const [walletState, setWalletState] = useState(wallet);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  // Update internal wallet state if parent updates it
  useEffect(() => {
    setWalletState(wallet);
  }, [wallet]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          size={"sm"}
          className="border-purple-500 text-purple-600 hover:bg-purple-100 rounded-lg cursor-pointer"
        >
          {walletState.hasPin ? "Change PIN" : "Set PIN"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white w-96">
        {walletState.hasPin ? (
          <ChangePinForm
            walletNumber={walletState.walletNumber}
            onSuccess={() => setOpen(false)}
          />
        ) : (
          <SetPinForm
            walletNumber={walletState.walletNumber}
            onSuccess={() => {
              // Close dialog and update UI immediately
              setOpen(false);
              setWalletState((prev) => ({ ...prev, hasPin: true }));
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
