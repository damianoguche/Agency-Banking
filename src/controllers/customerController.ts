/**
 * Controllers should not handle business logic. They can be replaced
 * with another method. Controllers handle requests and delegate the
 * processing to other components. Keep controllers lightweight and
 * decoupled from business logic to allow for flexibility and
 * easier replacement with alternative methods or technologies.
 */

import type { NextFunction, Request, Response } from "express";
import { Customer } from "../models/customer.ts";
import Wallet from "../models/wallet.ts";
import { createWalletNumber } from "../util/wallet_number.ts";

// Create Customer
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const t = (await Customer.sequelize?.transaction()) ?? null;
    const { fullName, phoneNumber, email, walletType } = req.body;

    const existing = await Customer.findOne({ where: { phoneNumber } });
    if (existing)
      return res.status(400).json({ message: "Customer already exists" });

    // Create customer
    const customer = await Customer.create(
      { fullName, phoneNumber, email },
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

    res.status(201).json({
      message: "Customer and wallet created",
      customer,
      wallet
    });
  } catch (err: any) {
    next(err);
    res.status(500).json({ message: err.message });
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
