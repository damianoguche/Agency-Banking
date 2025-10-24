export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  created_at: string;
  status: "completed" | "pending" | "failed";
  description?: string;
}
