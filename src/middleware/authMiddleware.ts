import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../util/jwt.ts";
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

  try {
    const decoded = verifyToken(token) as DecodedPayload;
    const customer = await Customer.findByPk(decoded.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    (req as any).customer = customer; // attach to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
