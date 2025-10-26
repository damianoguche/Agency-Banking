interface Transaction {
  id: string;
  type: string;
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
        <thead className="bg-purple-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-b border-purple-300 last:border-none"
            >
              <td className="p-3">
                {t.created_at.toString().slice(0, 19).replace("T", " ")}
              </td>
              <td className="p-3 capitalize">{t.type}</td>
              <td className="p-3 font-medium">
                ₦
                {Number(t.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}
              </td>
              <td>
                <span
                  className={`p-3 font-medium  ${
                    t.status === "successful"
                      ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                      : t.status === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {" "}
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
