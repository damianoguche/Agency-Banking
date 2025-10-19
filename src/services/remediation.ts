/**
 * A service to re-run ledger balance computation for one wallet and
 * optionally fix it:
 */

import sequelize from "../config/db.ts";
import { QueryTypes } from "sequelize";
import Wallet from "../models/wallet.ts";
import { LedgerAuditLog } from "../models/ledger_audit_log.ts";

export async function recalcWalletBalance(walletId: number) {
  const [result]: any = await sequelize.query(
    `
    SELECT 
      SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END) AS computed_balance
    FROM ledger_entries
    WHERE walletId = :walletId;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { walletId }
    }
  );

  return Number(result.computed_balance) || 0;
}

export async function fixWalletBalance(
  auditId: number,
  reviewer: string,
  note?: string
) {
  const audit = await LedgerAuditLog.findByPk(auditId);
  if (!audit) throw new Error("Audit record not found");

  const recomputed = await recalcWalletBalance(audit.walletId);

  const wallet = await Wallet.findByPk(audit.walletId);
  if (!wallet) throw new Error("Wallet not found!");

  const difference = recomputed - Number(wallet.balance);

  await sequelize.transaction(async (t) => {
    // Update wallet balance
    await wallet.update({ balance: recomputed }, { transaction: t });

    // Mark audit record as resolved
    await audit.update(
      {
        review_status: "resolved",
        reviewed_by: reviewer,
        resolution_notes:
          note || `Balance fixed from ${wallet.balance} → ${recomputed}`,
        resolved_at: new Date(),
        computedBalance: recomputed,
        actualBalance: recomputed,
        difference: 0,
        status: "consistent"
      },
      { transaction: t }
    );
  });

  return {
    walletId: wallet.id,
    oldBalance: wallet.balance,
    newBalance: recomputed,
    difference
  };
}
