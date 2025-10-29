export default function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md p-5 flex flex-col items-center justify-between min-h-[160px]">
      <div className="text-center">
        <h2 className="text-sm font-medium opacity-90">Current Balance</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          ₦
          {balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
      </div>
    </div>
  );
}
