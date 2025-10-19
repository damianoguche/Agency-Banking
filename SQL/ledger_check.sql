SELECT 
  wallet_number,
  SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END) AS computed_balance
FROM ledger_entries
GROUP BY wallet_number
HAVING computed_balance <> (
  SELECT balance FROM wallets WHERE wallets.walletNumber = ledger_entries.wallet_number
);
