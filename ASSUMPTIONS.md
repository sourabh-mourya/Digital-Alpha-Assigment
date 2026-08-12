# Product & Domain Assumptions

This document records key product and domain assumptions made where requirements were underspecified or flexible.

## 1. Rewards & Coin Math
- **Earning Rule**: 1 coin earned for every **₹100 spent** on transactions marked with `status = 'success'`.
- **Per-Transaction Cap**: Earnings are capped at **50 coins per single transaction** to prevent runaway coin inflation on high-value single transactions.
- **Initial Wallet Balance**: Seeded dynamically based on historical successful transactions in `transactions.json` (`SUM(LEAST(FLOOR(amount / 100), 50))`).

## 2. Transactions & Data
- **Transaction Statuses**: Allowed status types are strictly validated: `'success'`, `'pending'`, and `'failed'`.
- **Merchant Search**: Case-insensitive partial fuzzy search using PostgreSQL `pg_trgm` GIN indexes for low-latency search across 10,000+ records.
- **Pagination Defaults**: Default page size is **20 transactions per page** (maximum capped at 100) to balance payload size and rendering performance.

## 3. Rewards Catalogue
- Seeded with 5 realistic reward options:
  1. ₹100 Shopping Voucher — 50 Coins
  2. ₹250 Online Voucher — 120 Coins
  3. 5% Cashback Credit — 80 Coins
  4. Movie Ticket Pass — 150 Coins
  5. ₹500 Super Voucher — 220 Coins
