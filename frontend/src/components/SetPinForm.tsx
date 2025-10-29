import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface SetPinFormProps {
  walletNumber: string;
  onSuccess?: () => void;
}

interface SetPinFields {
  pin: string;
  confirmPin: string;
}

export default function SetPinForm({
  walletNumber,
  onSuccess
}: SetPinFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SetPinFields>();

  const API = import.meta.env.VITE_API_BASE;
  const { token } = useAuth();

  const onSubmit = async (data: SetPinFields) => {
    if (data.pin !== data.confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API}/wallet/set-pin`,
        {
          walletNumber,
          pin: data.pin
        },
        { headers }
      );
      toast.success("Transaction PIN set");
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to set PIN";
      toast.error(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-white rounded-xl shadow-sm space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        Set Transaction PIN
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1">New PIN</label>
        <Input
          type="password"
          className="border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={4}
          {...register("pin", {
            required: "PIN is required",
            pattern: {
              value: /^[0-9]{4}$/,
              message: "PIN must be a 4-digit number"
            }
          })}
        />
        {errors.pin && (
          <p className="text-red-500 text-sm mt-1">{errors.pin.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Confirm PIN</label>
        <Input
          type="password"
          className="border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={4}
          {...register("confirmPin", {
            required: "Please confirm your PIN",
            validate: (val) => val === watch("pin") || "PINs do not match"
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
        className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isSubmitting ? "Saving..." : "Set PIN"}
      </Button>
    </form>
  );
}
