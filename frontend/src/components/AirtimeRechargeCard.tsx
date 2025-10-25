// import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
// import axios from "axios";

// interface AirtimeFormData {
//   phone: string;
//   network: string;
//   amount: number;
// }

// export default function AirtimeRechargeCard({
//   refresh
// }: {
//   refresh: () => void;
// }) {
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { isSubmitting }
//   } = useForm<AirtimeFormData>();
//   const TxAPI = import.meta.env.VITE_TX_API_BASE;

//   const onSubmit = async (data: AirtimeFormData) => {
//     try {
//       await axios.post(`${TxAPI}/airtime/recharge`, data);
//       toast.success("Airtime recharge successful!");
//       reset();
//       refresh();
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Recharge failed");
//     }
//   };

//   return (
//     <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 flex flex-col justify-between">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">
//         Airtime Recharge
//       </h2>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
//         <input
//           type="tel"
//           placeholder="Phone number"
//           {...register("phone", { required: true })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         />

//         <select
//           {...register("network", { required: true })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         >
//           <option value="">Select network</option>
//           <option value="MTN">MTN</option>
//           <option value="Airtel">Airtel</option>
//           <option value="Glo">Glo</option>
//           <option value="9mobile">9mobile</option>
//         </select>

//         <input
//           type="number"
//           placeholder="Amount (₦)"
//           {...register("amount", { required: true, min: 50 })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         />

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer"
//         >
//           {isSubmitting ? "Processing..." : "Recharge"}
//         </button>
//       </form>
//     </div>
//   );
// }

import { useState } from "react";
import { useForm } from "react-hook-form";

interface AirtimeForm {
  phone: string;
  amount: number;
  network: string;
}

export default function AirtimeRechargeCard({
  refresh
}: {
  refresh: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<AirtimeForm>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: AirtimeForm) => {
    setLoading(true);
    try {
      console.log("Airtime purchase:", data);
      await new Promise((res) => setTimeout(res, 1000)); // simulate
      refresh();
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-between min-h-[200px]">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Airtime Recharge
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-2"
      >
        <input
          {...register("phone", { required: true })}
          type="tel"
          placeholder="Phone number"
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          {...register("network", { required: true })}
          className="w-full border border-purple-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">Select network</option>
          <option value="MTN">MTN</option>
          <option value="Airtel">Airtel</option>
          <option value="Glo">Glo</option>
          <option value="9mobile">9mobile</option>
        </select>

        <input
          {...register("amount", { required: true, valueAsNumber: true })}
          type="number"
          placeholder="Amount"
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white text-sm py-1.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 mt-1"
        >
          {loading ? "Processing..." : "Recharge"}
        </button>
      </form>
    </div>
  );
}
