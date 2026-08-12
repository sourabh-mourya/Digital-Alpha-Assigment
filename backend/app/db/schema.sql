-- Digital Alpha Rewards Dashboard — Database Schema
-- PostgreSQL 16+

-- Enable trigram extension for fuzzy merchant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────
-- Transactions (seeded from transactions.json)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    merchant_name   TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'Uncategorized',
    amount          NUMERIC(12,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'INR',
    payment_method  TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('success','failed','pending')),
    txn_date        TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast filtering / sorting
CREATE INDEX IF NOT EXISTS idx_txn_date       ON transactions (txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_txn_category   ON transactions (category);
CREATE INDEX IF NOT EXISTS idx_txn_status     ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_txn_amount     ON transactions (amount);
CREATE INDEX IF NOT EXISTS idx_txn_merchant_trgm ON transactions USING gin (merchant_name gin_trgm_ops);

-- ─────────────────────────────────────────────
-- Rewards catalogue (static, seeded once)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards_catalogue (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    coin_cost       INTEGER NOT NULL
);

-- ─────────────────────────────────────────────
-- User wallet (single user for this demo)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_wallet (
    id              SERIAL PRIMARY KEY,
    coin_balance    INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────
-- Redemption history
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id       INTEGER NOT NULL REFERENCES rewards_catalogue(id),
    coins_spent     INTEGER NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('confirmed','failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
