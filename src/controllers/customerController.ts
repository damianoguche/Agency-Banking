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
import { createWalletNumber } from "../util/wallet_number.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword } from "../util/passwordUtils.ts";

// Create Customer
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

/// Login Customer
export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const customer = await Customer.findOne({ where: { email } });
    if (!customer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } // token valid for 7 days
    );

    // Return success response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: customer.id,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phoneNumber
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
