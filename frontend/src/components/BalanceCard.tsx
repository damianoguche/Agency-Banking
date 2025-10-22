export default function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-xl bg-blue-600 text-white p-6 shadow-md flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-medium opacity-80">Current Balance</h2>
        <p className="mt-2 text-3xl font-bold">
          ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
