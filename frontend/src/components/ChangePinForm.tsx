import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChangePinFormProps {
  walletNumber: string;
  onSuccess?: () => void;
}

interface ChangePinFields {
  oldPin: string;
  newPin: string;
  confirmPin: string;
}

export default function ChangePinForm({
  walletNumber,
  onSuccess
}: ChangePinFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ChangePinFields>();

  const API = import.meta.env.VITE_API_BASE;

  const onSubmit = async (data: ChangePinFields) => {
    if (data.newPin !== data.confirmPin) {
      toast.error("New PINs do not match");
      return;
    }

    try {
      await axios.post(`${API}/wallet/change-pin`, {
        walletNumber,
        oldPin: data.oldPin,
        newPin: data.newPin
      });
      toast.success("Transaction PIN changed");
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || "PIN change failed";
      toast.error(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-white rounded-xl shadow-sm space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        Change Transaction PIN
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1">Current PIN</label>
        <Input
          type="password"
          className="border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={4}
          {...register("oldPin", {
            required: "Old PIN is required",
            pattern: {
              value: /^[0-9]{4}$/,
              message: "PIN must be a 4-digit number"
            }
          })}
        />
        {errors.oldPin && (
          <p className="text-red-500 text-sm mt-1">{errors.oldPin.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">New PIN</label>
        <Input
          type="password"
          className="border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={4}
          {...register("newPin", {
            required: "New PIN is required",
            pattern: {
              value: /^[0-9]{4}$/,
              message: "PIN must be a 4-digit number"
            }
          })}
        />
        {errors.newPin && (
          <p className="text-red-500 text-sm mt-1">{errors.newPin.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Confirm New PIN
        </label>
        <Input
          type="password"
          className="border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={4}
          {...register("confirmPin", {
            required: "Please confirm new PIN",
            validate: (val) => val === watch("newPin") || "PINs do not match"
          })}
        />
        {errors.confirmPin && (
          <p className="text-red-500 text-sm mt-1">
            {errors.confirmPin.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isSubmitting ? "Updating..." : "Change PIN"}
      </Button>
    </form>
  );
}
