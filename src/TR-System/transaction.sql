-- Summarize debit vs credit per reference
SELECT
  reference,
  COUNT(CASE WHEN type = 'DEBIT' THEN 1 END) AS debit_count,
  COUNT(CASE WHEN type = 'CREDIT' THEN 1 END) AS credit_count,
  SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) AS debit_sum,
  SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS credit_sum,
  COUNT(CASE WHEN type = 'REVERSAL' THEN 1 END) AS reversal_count,
  MAX(createdAt) AS latest
FROM transaction
GROUP BY reference
HAVING
  -- any mismatch between debits and credits OR missing reconciliation leg
  debit_sum != credit_sum
  OR debit_count = 0
  OR credit_count = 0
  OR reversal_count > 0 -- include reversals for review
ORDER BY latest DESC
LIMIT 200;
