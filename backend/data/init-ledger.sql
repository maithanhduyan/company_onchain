CREATE TABLE IF NOT EXISTS entries (
  entry_id TEXT PRIMARY KEY,
  account_debit TEXT,
  account_credit TEXT,
  amount REAL,
  currency TEXT,
  timestamp TEXT
);
