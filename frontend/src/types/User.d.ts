export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletNumber: string;
  status: "active" | "inactive";
  role: "user" | "admin";
  hasPin?: boolean;
  created_at: Date;
}
