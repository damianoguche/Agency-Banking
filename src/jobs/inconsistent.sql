CREATE OR REPLACE VIEW vw_inconsistent_ledgers AS
SELECT
  w.walletNumber AS walletId,
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) AS computed_balance,
  w.balance AS actual_balance,
  (COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - w.balance) AS difference,
  CASE 
    WHEN (COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - w.balance) = 0 
      THEN 'consistent'
    ELSE 'inconsistent'
  END AS status,
  NOW() AS generated_at
FROM wallets w
LEFT JOIN ledger_entries le ON w.walletNumber = le.wallet_number
GROUP BY w.walletNumber
HAVING difference <> 0;
