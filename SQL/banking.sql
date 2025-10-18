-- =========================================================
-- DATABASE: agency_banking
-- TABLES: customers, wallets, transactions
-- =========================================================

CREATE DATABASE IF NOT EXISTS agency_banking;
USE agency_banking;

-- =========================================================
-- CUSTOMERS TABLE
-- =========================================================
CREATE TABLE customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  bvn INT UNSIGNED NOT NULL UNIQUE,
  phoneNumber VARCHAR(20) UNIQUE NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- WALLETS TABLE
-- =========================================================
CREATE TABLE wallets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customerId INT UNSIGNED NOT NULL,
  walletNumber VARCHAR(20) UNIQUE NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TRANSACTIONS TABLE
-- =========================================================
CREATE TABLE transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  walletNumber VARCHAR(50) UNIQUE NOT NULL,
  reference VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('credit', 'debit', 'reversal') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  senderWalletNumber INT UNSIGNED NULL,
  receiverWalletNumber INT UNSIGNED NULL,
  status ENUM('pending', 'success', 'failed', 'rollback') DEFAULT 'pending',
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderWalletNumber) REFERENCES wallets(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  FOREIGN KEY (receiverWalletNumber) REFERENCES wallets(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);
