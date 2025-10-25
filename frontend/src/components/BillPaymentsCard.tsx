// import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
// import axios from "axios";

// interface BillFormData {
//   category: string;
//   accountNumber: string;
//   amount: number;
// }

// export default function BillPaymentsCard() {
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { isSubmitting }
//   } = useForm<BillFormData>();
//   const TxAPI = import.meta.env.VITE_TX_API_BASE;

//   const onSubmit = async (data: BillFormData) => {
//     try {
//       await axios.post(`${TxAPI}/bills/pay`, data);
//       toast.success("Bill payment successful!");
//       reset();
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Payment failed");
//     }
//   };

//   return (
//     <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 flex flex-col justify-between">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">
//         Bill Payments
//       </h2>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
//         <select
//           {...register("category", { required: true })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         >
//           <option value="">Select bill type</option>
//           <option value="electricity">Electricity</option>
//           <option value="tv">Cable TV</option>
//           <option value="internet">Internet</option>
//           <option value="water">Water</option>
//         </select>

//         <input
//           type="text"
//           placeholder="Customer / Meter Number"
//           {...register("accountNumber", { required: true })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         />

//         <input
//           type="number"
//           placeholder="Amount (₦)"
//           {...register("amount", { required: true, min: 100 })}
//           className="w-full border border-purple-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
//         />

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer"
//         >
//           {isSubmitting ? "Processing..." : "Pay Bill"}
//         </button>
//       </form>
//     </div>
//   );
// }

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axios from "axios";

interface BillPaymentForm {
  billType: string;
  amount: number;
  account: string;
}

export default function BillPaymentsCard() {
  const TxAPI = import.meta.env.VITE_TX_API_BASE;

  const { register, handleSubmit, reset } = useForm<BillPaymentForm>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: BillPaymentForm) => {
    setLoading(true);
    try {
      console.log("Bill payment:", data);
      await axios.post(`${TxAPI}/bills/pay`, data);
      toast.success("Bill payment successful!");
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-between min-h-[200px]">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Bill Payments
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-2"
      >
        {/* Bill Type Select */}
        <select
          {...register("billType", { required: true })}
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        >
          <option value="">Select Bill Type</option>
          <option value="electricity">Electricity</option>
          <option value="tv">Cable TV</option>
          <option value="internet">Internet</option>
          <option value="water">Water</option>
          <option value="waste">Waste Disposal</option>
        </select>

        {/* Account / Meter Number */}
        <input
          {...register("account", { required: true })}
          type="text"
          placeholder="Account or Meter Number"
          className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        {/* Amount */}
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
          {loading ? "Processing..." : "Pay Bill"}
        </button>
      </form>
    </div>
  );
}
