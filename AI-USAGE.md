# AI Assistance Audit & Technical Decisions Log

This document records how AI tools were utilized during development, including rejected or corrected AI outputs.

## 1. Overview of AI Usage
- **Architecture & Scaffolding**: AI was used to plan file structures, generate TypeScript interfaces, and set up Pydantic model schemas.
- **Pair Programming**: AI assisted in writing initial SQL queries, CSS module tokens, and Recharts boilerplate.

## 2. Examples of Rejected / Corrected AI Outputs

### Example 1: Inefficient In-Memory Pagination
- **AI Proposal**: AI initially generated a `/transactions` endpoint that selected all 10,000 rows into Python lists and filtered/paginated them using Python slices (`data[offset:offset+limit]`).
- **Correction**: Rejected. Slicing 10k rows in Python memory destroys performance. Replaced with parameterized SQL queries utilizing `WHERE`, `ORDER BY`, and `LIMIT / OFFSET` directly in PostgreSQL.

### Example 2: Unsafe Double-Redeem Race Condition
- **AI Proposal**: In the `/rewards/{id}/redeem` service handler, AI initially generated a simple `SELECT coin_balance FROM user_wallet` followed by `UPDATE user_wallet SET coin_balance = ...`.
- **Correction**: Rejected. Under concurrent requests (e.g. double clicking the Redeem button), this read-then-write pattern allows race conditions where two redemptions read the same balance before either debits it. Corrected by wrapping the operation in an explicit SQL transaction (`async with conn.transaction()`) and acquiring a row-level lock using `SELECT ... FOR UPDATE`.

### Example 3: Vercel Monorepo Deployment Subfolder Path Issue
- **AI Proposal**: AI initially recommended setting `buildCommand: "cd frontend && npm run build"` in `vercel.json`.
- **Correction**: Rejected. When importing a repository with Root Directory configured to `frontend` in Vercel settings, Vercel executes commands *inside* the `frontend` folder already. Attempting `cd frontend` failed with `No such file or directory`. Corrected to use clean Vercel framework settings (`{"framework": "nextjs"}`).
