CREATE TABLE outbox (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  aggregate_type VARCHAR(255) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX (aggregate_type, aggregate_id),
  INDEX (published)
);
