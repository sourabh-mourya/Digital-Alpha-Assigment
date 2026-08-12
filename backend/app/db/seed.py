"""
Seed script — loads transactions.json into PostgreSQL and sets up
rewards catalogue + user wallet.

Run from the backend/ directory:
    python -m app.db.seed
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://da_user:da_pass_local@localhost:5432/digital_alpha",
)

# ── Locate files ──────────────────────────────────────────────

# transactions.json lives one level above digital-alpha-rewards/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
PROJECT_DIR = BACKEND_DIR.parent                              # digital-alpha-rewards/
REPO_ROOT = PROJECT_DIR.parent                                # Digital Alpha Assigment/

TRANSACTIONS_FILE = REPO_ROOT / "transactions.json"
SCHEMA_FILE = Path(__file__).resolve().parent / "schema.sql"


# ── Data-cleaning helpers ─────────────────────────────────────

def parse_timestamp(raw) -> datetime:
    """
    Handle the four timestamp formats found in transactions.json:
    1. ISO string: "2025-10-03T21:03:27Z"
    2. ISO with offset: "2026-07-01T16:18:43+05:30"
    3. Date-only string: "2025-07-03"
    4. Epoch milliseconds (int): 1768265109000
    5. DD/MM/YYYY HH:MM:SS: "27/05/2026 01:17:38"
    """
    if isinstance(raw, (int, float)):
        # Epoch milliseconds → UTC datetime
        return datetime.fromtimestamp(raw / 1000, tz=timezone.utc)

    if isinstance(raw, str):
        raw_clean = raw.strip()

        # Try ISO format first (handles Z and +HH:MM offsets)
        try:
            dt = datetime.fromisoformat(raw_clean.replace("Z", "+00:00"))
            return dt.astimezone(timezone.utc)
        except ValueError:
            pass

        # Try DD/MM/YYYY HH:MM:SS
        try:
            dt = datetime.strptime(raw_clean, "%d/%m/%Y %H:%M:%S")
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

        # Try date-only (YYYY-MM-DD)
        try:
            dt = datetime.strptime(raw_clean, "%Y-%m-%d")
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    # Fallback — shouldn't happen with this dataset
    print(f"  WARNING: Could not parse timestamp: {raw!r}, using now()")
    return datetime.now(timezone.utc)


def clean_status(raw: str) -> str:
    """Normalize status to lowercase."""
    return raw.strip().lower()


def clean_category(raw) -> str:
    """Handle missing / null / empty category."""
    if raw is None or (isinstance(raw, str) and raw.strip() == ""):
        return "Uncategorized"
    return raw.strip()


def clean_amount(raw) -> Decimal:
    """Cast string amounts to Decimal; pass numeric types through."""
    if isinstance(raw, str):
        try:
            return Decimal(raw.strip())
        except InvalidOperation:
            print(f"  ⚠ Invalid amount string: {raw!r}, using 0")
            return Decimal("0")
    return Decimal(str(raw))


# ── Rewards catalogue seed data ──────────────────────────────

REWARDS = [
    ("₹100 Amazon Voucher", "Redeemable on Amazon India", 50),
    ("₹250 Flipkart Voucher", "Redeemable on Flipkart", 120),
    ("5% Cashback Coupon", "5% cashback on next transaction, max ₹200", 80),
    ("Movie Ticket", "One PVR/INOX movie ticket, any city", 150),
    ("₹500 Swiggy Voucher", "Redeemable on Swiggy orders", 220),
]


# ── Main seed logic ──────────────────────────────────────────

def seed():
    print("=" * 60)
    print("  Digital Alpha — Database Seed")
    print("=" * 60)

    if not TRANSACTIONS_FILE.exists():
        print(f"\n✗ transactions.json not found at:\n  {TRANSACTIONS_FILE}")
        print("  Make sure the file is in the repo root (Digital Alpha Assigment/).")
        sys.exit(1)

    print(f"\n→ Connecting to database...")
    conn = psycopg.connect(DATABASE_URL)
    conn.autocommit = False

    try:
        cur = conn.cursor()

        # 1. Run schema
        print("→ Applying schema.sql...")
        schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")
        cur.execute(schema_sql)
        conn.commit()
        print("  ✓ Schema applied")

        # 2. Clear existing data (idempotent re-runs)
        print("→ Clearing existing data...")
        cur.execute("DELETE FROM redemptions")
        cur.execute("DELETE FROM user_wallet")
        cur.execute("DELETE FROM rewards_catalogue")
        cur.execute("DELETE FROM transactions")
        conn.commit()
        print("  ✓ Tables cleared")

        # 3. Load and clean transactions
        print(f"→ Loading {TRANSACTIONS_FILE.name}...")
        with open(TRANSACTIONS_FILE, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        print(f"  Found {len(raw_data)} records")

        print("→ Cleaning and inserting transactions (bulk)...")
        rows = []
        skipped = 0
        for rec in raw_data:
            try:
                row = (
                    rec["id"],
                    rec["merchant"],
                    clean_category(rec.get("category")),
                    clean_amount(rec["amount"]),
                    rec.get("currency", "INR"),
                    rec.get("payment_method", "Unknown"),
                    clean_status(rec["status"]),
                    parse_timestamp(rec["timestamp"]),
                )
                rows.append(row)
            except Exception as e:
                skipped += 1
                print(f"  ⚠ Skipped record {rec.get('id', '?')}: {e}")

        # Bulk insert using executemany
        insert_sql = """
            INSERT INTO transactions (id, merchant_name, category, amount, currency, payment_method, status, txn_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """
        cur.executemany(insert_sql, rows)
        conn.commit()
        print(f"  ✓ Inserted {len(rows)} transactions ({skipped} skipped)")

        # 4. Seed rewards catalogue
        print("→ Seeding rewards catalogue...")
        for name, desc, cost in REWARDS:
            cur.execute(
                "INSERT INTO rewards_catalogue (name, description, coin_cost) VALUES (%s, %s, %s)",
                (name, desc, cost),
            )
        conn.commit()
        print(f"  ✓ Inserted {len(REWARDS)} reward items")

        # 5. Compute and seed wallet balance
        # Rule: 1 coin per ₹100 spent on success transactions, capped at 50 per txn
        # Negative amounts (refunds) earn 0 coins
        print("→ Computing wallet balance...")
        cur.execute("""
            SELECT COALESCE(SUM(
                LEAST(FLOOR(amount / 100), 50)
            ), 0)::INTEGER
            FROM transactions
            WHERE status = 'success'
              AND amount > 0
        """)
        total_coins = cur.fetchone()[0]

        cur.execute(
            "INSERT INTO user_wallet (coin_balance) VALUES (%s)",
            (total_coins,),
        )
        conn.commit()
        print(f"  ✓ Wallet seeded with {total_coins} coins")

        # 6. Final verification
        print("\n→ Verification:")
        cur.execute("SELECT COUNT(*) FROM transactions")
        print(f"  transactions:       {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM rewards_catalogue")
        print(f"  rewards_catalogue:  {cur.fetchone()[0]} rows")
        cur.execute("SELECT coin_balance FROM user_wallet LIMIT 1")
        print(f"  wallet balance:     {cur.fetchone()[0]} coins")
        cur.execute("SELECT status, COUNT(*) FROM transactions GROUP BY status ORDER BY status")
        for row in cur.fetchall():
            print(f"    status={row[0]}: {row[1]}")
        cur.execute("SELECT category, COUNT(*) FROM transactions GROUP BY category ORDER BY COUNT(*) DESC LIMIT 5")
        print("  top 5 categories:")
        for row in cur.fetchall():
            print(f"    {row[0]}: {row[1]}")

        print("\n" + "=" * 60)
        print("  ✓ Seed complete!")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Seed failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
