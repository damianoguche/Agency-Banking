CREATE TABLE idempotency_store (
  key VARCHAR(100) PRIMARY KEY,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  response_code INT NOT NULL,
  response_body JSON NOT NULL,
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW()
);
