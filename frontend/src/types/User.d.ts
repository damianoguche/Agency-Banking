export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  walletNumber: string;
}

// export interface User {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;
//   wallets: { walletNumber: string; balance: number }[];
// }
