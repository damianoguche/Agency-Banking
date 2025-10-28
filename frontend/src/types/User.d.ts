export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletNumber: string;
  status: "active" | "suspended";
  role: "user" | "admin";
  hasPin?: boolean;
}
