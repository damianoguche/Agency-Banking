import { Customer } from "./src/models/customer.ts";
import Wallet from "./src/models/wallet.ts";

// node --loader ts-node/esm

const customer = await Customer.findByPk(17, { include: ["wallets"] });
const result = customer!.wallets
  ?.map((wallet) => wallet.toJSON())
  .map((w) => ({
    walletType: w.walletType,
    balance: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: w.currency,
      minimumFractionDigits: 2
    }).format(w.balance),
    walletNumber: w.walletNumber,
    currency: w.currency
  }));

const wallet = await Wallet.findByPk(20, { include: "customer" });
const data = wallet!.customer?.toJSON();

console.table([
  {
    fullName: data?.fullName,
    phoneNumber: data?.phoneNumber,
    bvn: data?.bvn,
    status: data?.status,
    created: data?.created_at?.toISOString().slice(0, 19).replace("T", " ")
  }
]);

console.table(result);
