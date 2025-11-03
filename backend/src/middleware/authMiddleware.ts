import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.ts";
import { Customer } from "../models/customer.ts";
import type { JwtPayload } from "jsonwebtoken";

interface DecodedPayload extends JwtPayload {
  id: number;
  email: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1] as string;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = verifyToken(token) as DecodedPayload;
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const customer = await Customer.findByPk(decoded.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    (req as any).customer = customer;

    next();
  } catch (err: any) {
    console.error(err.message);
    return res.status(401).json({ message: err.message });
  }
}
