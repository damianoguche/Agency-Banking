/**
 * Controllers should not handle business logic. They can be replaced
 * with another method. Controllers handle requests and delegate the
 * processing to other components. Keep controllers lightweight and
 * decoupled from business logic to allow for flexibility and
 * easier replacement with alternative methods or technologies.
 */

import type { Request, Response } from "express";
import { Customer } from "../models/customer.ts";
import Wallet from "../models/wallet.ts";
import { createWalletNumber } from "../utils/wallet_number.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { hashPassword } from "../utils/passwordUtils.ts";
import ms from "ms";

/**
 * POST /api/customers/register
 * Accessible by all users
 * Creates new customers
 */
export const createCustomer = async (req: Request, res: Response) => {
  const t = (await Customer.sequelize?.transaction()) ?? null;
  try {
    const { fullName, phoneNumber, email, password, walletType } = req.body;

    if (!fullName || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if customer exists
    const existing = await Customer.findOne({ where: { phoneNumber } });
    if (existing) {
      await t?.rollback();
      return res.status(400).json({ message: "Customer already exists" });
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Create customer
    const customer = await Customer.create(
      { fullName, phoneNumber, email, password: hashedPassword },
      { transaction: t }
    );

    // Create default wallet
    const wallet = await Wallet.create(
      {
        walletNumber: await createWalletNumber(),
        customerId: customer.id,
        walletType
      },
      { transaction: t }
    );

    await t?.commit();

    return res.status(201).json({
      message: "Customer and wallet created successfully",
      customer: {
        id: customer.id,
        name: customer.fullName,
        phone: customer.phoneNumber,
        email: customer.email
      },
      wallet
    });
  } catch (err: any) {
    await t?.rollback();
    console.error("Error creating customer:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

// Create Wallet
export const createWallet = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { walletType, currency } = req.body;
    const customer = await Customer.findByPk(customerId);

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    // Check if customer already has this wallet type
    const existing = await Wallet.findOne({
      where: { customerId: customer.id, walletType, currency }
    });

    if (existing)
      return res
        .status(400)
        .json({ message: `Customer already has a ${walletType} wallet.` });

    const wallet = await Wallet.create({
      walletNumber: await createWalletNumber(),
      customerId: customer.id,
      walletType,
      currency
    });

    res.status(201).json({
      message: `${walletType} wallet in ${currency} created!`,
      wallet
    });
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Duplicate wallet type/currency combination"
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Login Customer
export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check for existing customer
    const customer = await Customer.findOne({ where: { email } });
    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get wallet for this customer
    const wallet = await Wallet.findOne({
      where: { customerId: customer.id },
      attributes: ["walletNumber", "balance", "pinHash"]
    });

    if (!wallet) return res.status(404).json({ message: "No wallet found." });

    // Create JWT
    const payload = { id: customer.id, email: customer.email };
    const secret = (process.env.JWT_SECRET as string) || "supersecretkey";
    const expiresIn = process.env.JWT_EXPIRES_IN as ms.StringValue;
    const options: SignOptions = { expiresIn };
    const token = jwt.sign(payload, secret, options);

    // Return success response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: customer.id,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phoneNumber,
        role: customer.role,
        walletNumber: wallet.walletNumber,
        hasPin: !!wallet?.pinHash
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout customer
export const logoutCustomer = async (req: Request, res: Response) => {
  // Client deletes token from localStorage
  res.json({ message: "Logout successful" });
};

// Get me
// profile + session verification endpoint.
export const getMe = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;

    // Re-fetch with wallet association to ensure walletNumber is included
    const fullCustomer = await Customer.findByPk(customer.id, {
      include: [
        {
          model: Wallet,
          as: "wallets",
          attributes: ["walletNumber", "pinHash"]
        }
      ]
    });

    if (!fullCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // safely handle undefined/null arrays
    const wallets = (fullCustomer as any).wallets as Wallet[] | undefined;
    const walletNumber = wallets?.[0]?.walletNumber ?? null;

    return res.status(200).json({
      id: fullCustomer.id,
      name: fullCustomer.fullName,
      email: fullCustomer.email,
      phone: fullCustomer.phoneNumber,
      walletNumber,
      role: fullCustomer.role,
      hasPin: !!wallets?.[0]?.pinHash
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch user", error: err });
  }
};

// Get wallet balance
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const { walletNumber } = req.params;

    // Validate request
    if (!walletNumber) {
      return res.status(400).json({ message: "Wallet number is required." });
    }

    // Find wallet
    const wallet = await Wallet.findOne({
      where: { walletNumber },
      attributes: ["walletNumber", "balance", "currency", "updated_at"]
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    // Return response
    return res.status(200).json({
      message: "Wallet balance retrieved.",
      balance: Number(wallet.balance)
    });
  } catch (error: any) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({
      message: "An error occurred while fetching wallet balance.",
      error: error.message
    });
  }
};
