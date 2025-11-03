import type { Request, Response } from "express";
import { LedgerAuditLog } from "../models/ledger_audit_log.ts";
import {
  fixWalletBalance,
  recalcWalletBalance
} from "../services/remediation.ts";
import Wallet from "../models/wallet.ts";

export const getInconsistencies = async (_: any, res: Response) => {
  const pending = await LedgerAuditLog.findAll({
    where: { review_status: "pending" },
    order: [["created_at", "DESC"]]
  });
  res.status(200).json(pending);
};

export const recalBalance = async (req: Request, res: Response) => {
  const { auditId } = req.params;

  const audit = await LedgerAuditLog.findByPk(auditId);
  if (!audit) return res.status(404).json({ error: "Audit record Not found" });

  // Fetch wallet to get the wallet_number
  const wallet = await Wallet.findByPk(audit.walletId);
  if (!wallet) {
    return res.status(404).json({ error: "Wallet not found" });
  }

  // Pass wallet_number (string) to recalc
  const recomputed = await recalcWalletBalance(wallet.walletNumber);
  res
    .status(200)
    .json({
      walletId: audit.walletId,
      walletNumber: wallet.walletNumber,
      recomputed
    });
};

export const fixWallet = async (req: Request, res: Response) => {
  const { note, reviewer } = req.body;

  const result = await fixWalletBalance(
    Number(req.params.auditId),
    reviewer,
    note
  );

  res.status(200).json(result);
};
