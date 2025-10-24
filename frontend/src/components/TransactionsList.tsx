interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  created_at: string;
  status: string;
  description?: string;
}

export default function TransactionsList({
  transactions
}: {
  transactions: Transaction[];
}) {
  if (!transactions.length)
    return <p className="text-gray-500 text-sm">No transactions found.</p>;

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b last:border-none">
              <td className="p-3">
                {t.created_at.toString().slice(0, 19).replace("T", " ")}
              </td>
              <td className="p-3 capitalize">{t.type}</td>
              <td className="p-3 font-medium">₦{t.amount.toLocaleString()}</td>
              <td
                className={`p-3 font-medium ${
                  t.status === "completed"
                    ? "text-green-600"
                    : t.status === "failed"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {t.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
