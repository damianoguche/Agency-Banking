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

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer">
          {wallet.hasPin ? "Change PIN" : "Set PIN"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white w-96">
        {wallet.hasPin ? (
          <ChangePinForm
            walletNumber={wallet.walletNumber}
            onSuccess={() => setOpen(false)}
          />
        ) : (
          <SetPinForm
            walletNumber={wallet.walletNumber}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
