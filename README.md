# Digital Alpha Rewards — Full-Stack Credit Card Rewards Dashboard

A production-grade credit card transactions, spend analytics, and coin-based rewards redemption dashboard built for scale. Handles 10,000+ transaction records with low-latency server-side SQL pagination, Redis analytical caching, and atomic, transaction-safe coin redemptions.

---

## 🌐 Live Production Links

- **Frontend Dashboard (Vercel)**: [https://digital-alpha-assigment.vercel.app/](https://digital-alpha-assigment.vercel.app/)
- **Backend API (Render)**: `https://da-backend.onrender.com`
- **Interactive Swagger API Docs**: `https://da-backend.onrender.com/docs`

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | **Next.js 16 + React 19 + TypeScript** | App Router, hand-built custom table (no UI component libraries), CSS Modules |
| **Charts** | **Recharts** | Interactive Spend Category Pie/Donut Chart & Monthly Spending Trend Area Chart |
| **Backend** | **FastAPI (Python 3.11)** | Asynchronous RESTful API with Pydantic type validation |
| **Database** | **PostgreSQL 16+ (psycopg v3)** | Server-side pagination, indexing (`pg_trgm`, `idx_txn_date`), raw SQL pooling |
| **Caching** | **Redis** | Async caching layer for read-heavy catalogue & analytical aggregations |

---

## 🚀 5-Minute Local Setup Guide

Follow these steps to run the complete stack locally on Windows/Linux/macOS:

### 1. Clone & Setup Environment
```bash
git clone https://github.com/sourabh-mourya/Digital-Alpha-Assigment.git
cd Digital-Alpha-Assigment
```

### 2. Start PostgreSQL & Redis (Docker)
```bash
docker-compose up -d
```

### 3. Setup & Seed Backend (FastAPI)
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1 | Linux/Mac: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Database Schema & Seed (Loads 10,000 transactions from JSON + Wallet)
python -m app.db.seed

# Start FastAPI server
python run_backend.py
```
*Backend runs locally at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).*

### 4. Setup & Start Frontend (Next.js)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs locally at `http://localhost:3000`.*

---

## 🧪 Running Backend Unit Tests

Run automated Pytest unit tests for endpoint health, rewards redemption validation, and transactions pagination:
```bash
cd backend
pytest tests/test_api.py
```

---

## ⚡ Redis Caching Strategy & Console Monitoring

- **`rewards:catalogue`** (TTL: 10 mins) — Caches static voucher catalogue.
- **`analytics:category_breakdown`** (TTL: 5 mins) — Caches SQL `GROUP BY` category aggregation.
- **`analytics:monthly_trend`** (TTL: 5 mins) — Caches monthly spend trend data.
- **Live Logging**: Backend console prints `✅ [REDIS CACHE HIT]` or `❌ [REDIS CACHE MISS]` for every query, and Browser DevTools (F12) displays data source indicators.

---

## 📋 Feature Checklist (Done vs Known Scope)

### ✅ Completed & Delivered:
- [x] **Hand-Built Transactions Table**: Sticky header, zebra striping, loading skeletons, empty/error state, responsive down to 360px.
- [x] **Combinable Server-Side Filters**: Category, Date Range (`date_from`/`date_to`), Amount Range (`amount_min`/`amount_max`), Payment Status, and Debounced Merchant Search.
- [x] **Spend Analytics Charts**: Category breakdown pie chart + Monthly trend area chart with two-way cross-filtering.
- [x] **Transaction Detail Modal**: Accessible modal displaying complete transaction metadata upon row click.
- [x] **Coin-Based Rewards Store**: Visible coin balance, voucher grid, confirmation modal, optimistic updates with rollback error handling.
- [x] **Race-Condition Safe Backend**: Row-level locking with `SELECT ... FOR UPDATE` in PostgreSQL transactions (`BEGIN ... COMMIT`).
- [x] **Production Documentation**: [ASSUMPTIONS.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/ASSUMPTIONS.md), [DECISIONS.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/DECISIONS.md), [AI-USAGE.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/AI-USAGE.md).

---

## 📂 Project Architecture & Documentation

- [ASSUMPTIONS.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/ASSUMPTIONS.md) — Product assumptions, coin earning formula, and status rules.
- [DECISIONS.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/DECISIONS.md) — Technical architecture trade-offs and **"What I'd add at production scale (not implemented here)"** section detailing Nginx, Load Balancers, PgBouncer, and Horizontal Scaling.
- [AI-USAGE.md](file:///c:/Digital%20Alpha%20Assigment/digital-alpha-rewards/AI-USAGE.md) — Audit log of AI assistance and rejected output examples.
