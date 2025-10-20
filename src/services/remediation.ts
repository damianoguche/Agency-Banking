import sequelize from "../config/db.ts";
import { QueryTypes } from "sequelize";
import Wallet from "../models/wallet.ts";
import { LedgerAuditLog } from "../models/ledger_audit_log.ts";

/**
 * Recalculate balance for a wallet based on ledger entries.
 */
export async function recalcWalletBalance(walletNumber: string) {
  try {
    const [result]: any = await sequelize.query(
      `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN entry_type = 'CREDIT' THEN amount 
            WHEN entry_type = 'DEBIT' THEN -amount 
            ELSE 0 
          END
        ), 0) AS computed_balance
      FROM ledger_entries
      WHERE wallet_number = :walletNumber;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { walletNumber }
      }
    );

    return Number(result.computed_balance) || 0;
  } catch (err: any) {
    console.error("Error in recalcWalletBalance:", err);
    throw new Error(`Failed to recalc wallet ${walletNumber}: ${err.message}`);
  }
}

/**
 * Fix an inconsistent wallet balance using recomputation.
 */
export async function fixWalletBalance(
  walletId: number,
  reviewer: string,
  note?: string
) {
  try {
    const audit = await LedgerAuditLog.findOne({ where: { walletId } });

    if (!audit) throw new Error("Audit record not found");

    let walletNumber = audit.walletId;

    const wallet = await Wallet.findOne({ where: { walletNumber } });
    if (!wallet) throw new Error("Wallet not found!");

    const recomputed = await recalcWalletBalance(wallet.walletNumber);
    const difference = recomputed - Number(wallet.balance);

    await sequelize.transaction(async (t) => {
      // Update wallet
      await wallet.update({ balance: recomputed }, { transaction: t });

      // Update audit log
      await audit.update(
        {
          review_status: "resolved",
          reviewed_by: reviewer,
          resolution_notes:
            note || `Balance fixed from ${wallet.balance} → ${recomputed}`,
          resolved_at: new Date(),
          computed_balance: recomputed,
          actual_balance: recomputed,
          difference: 0,
          status: "consistent"
        },
        { transaction: t }
      );
    });

    return {
      walletNumber: wallet.walletNumber,
      oldBalance: wallet.balance,
      newBalance: recomputed,
      difference
    };
  } catch (err: any) {
    console.error("Error in fixWalletBalance:", err);
    throw new Error(`Remediation failed for audit ${walletId}: ${err.message}`);
  }
}
