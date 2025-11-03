import type { Customer } from "../models/customer";

declare global {
  namespace Express {
    export interface Request {
      customer?: Customer;
    }
  }
}
