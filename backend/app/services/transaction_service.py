"""
Transaction service — builds SQL queries for filtering, sorting,
and pagination. All filtering happens in the database, never in Python.
"""

import math
from app.db.connection import get_connection
from app.models.transaction import (
    TransactionResponse,
    TransactionListResponse,
    PaginationMeta,
)

# Whitelist of sortable columns to prevent SQL injection via sort_by
SORTABLE_COLUMNS = {
    "txn_date": "txn_date",
    "amount": "amount",
    "merchant_name": "merchant_name",
    "category": "category",
    "status": "status",
    "created_at": "created_at",
}


async def list_transactions(
    page: int = 1,
    limit: int = 20,
    category: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    search: str | None = None,
    sort_by: str = "txn_date",
    sort_dir: str = "desc",
) -> TransactionListResponse:
    """
    Fetch transactions with SQL-level filtering, sorting, and pagination.
    """
    # Build WHERE clauses
    conditions: list[str] = []
    params: list = []
    param_idx = 1

    if category:
        conditions.append(f"category = ${param_idx}")
        params.append(category)
        param_idx += 1

    if status:
        conditions.append(f"status = ${param_idx}")
        params.append(status.lower())
        param_idx += 1

    if date_from:
        conditions.append(f"txn_date >= ${param_idx}::timestamptz")
        params.append(date_from)
        param_idx += 1

    if date_to:
        conditions.append(f"txn_date <= ${param_idx}::timestamptz")
        params.append(date_to)
        param_idx += 1

    if amount_min is not None:
        conditions.append(f"amount >= ${param_idx}")
        params.append(amount_min)
        param_idx += 1

    if amount_max is not None:
        conditions.append(f"amount <= ${param_idx}")
        params.append(amount_max)
        param_idx += 1

    if search:
        conditions.append(f"merchant_name ILIKE ${param_idx}")
        params.append(f"%{search}%")
        param_idx += 1

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Validate sort column (prevent injection)
    sort_col = SORTABLE_COLUMNS.get(sort_by, "txn_date")
    sort_direction = "ASC" if sort_dir.lower() == "asc" else "DESC"

    # Count total matching rows
    count_sql = f"SELECT COUNT(*) FROM transactions {where_clause}"

    # Fetch paginated data
    offset = (page - 1) * limit
    data_sql = f"""
        SELECT id, merchant_name, category, amount, currency,
               payment_method, status, txn_date, created_at
        FROM transactions
        {where_clause}
        ORDER BY {sort_col} {sort_direction}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    async with get_connection() as conn:
        # Get total count (use same params minus limit/offset)
        count_result = await conn.execute(count_sql, params[:-2] if params[:-2] else None)
        total = (await count_result.fetchone())[0]

        # Get data
        result = await conn.execute(data_sql, params)
        rows = await result.fetchall()

    transactions = [
        TransactionResponse(
            id=row[0],
            merchant_name=row[1],
            category=row[2],
            amount=row[3],
            currency=row[4],
            payment_method=row[5],
            status=row[6],
            txn_date=row[7],
            created_at=row[8],
        )
        for row in rows
    ]

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return TransactionListResponse(
        data=transactions,
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        ),
    )


async def get_transaction_by_id(txn_id: str) -> TransactionResponse | None:
    """Fetch a single transaction by ID."""
    sql = """
        SELECT id, merchant_name, category, amount, currency,
               payment_method, status, txn_date, created_at
        FROM transactions
        WHERE id = $1
    """
    async with get_connection() as conn:
        result = await conn.execute(sql, [txn_id])
        row = await result.fetchone()

    if not row:
        return None

    return TransactionResponse(
        id=row[0],
        merchant_name=row[1],
        category=row[2],
        amount=row[3],
        currency=row[4],
        payment_method=row[5],
        status=row[6],
        txn_date=row[7],
        created_at=row[8],
    )


async def get_category_breakdown() -> list[dict]:
    """
    Aggregate spend by category (for analytics chart).
    Returns [{category, total_amount, transaction_count}].
    """
    sql = """
        SELECT category,
               SUM(amount)::NUMERIC(14,2) AS total_amount,
               COUNT(*) AS transaction_count
        FROM transactions
        WHERE status = 'success' AND amount > 0
        GROUP BY category
        ORDER BY total_amount DESC
    """
    async with get_connection() as conn:
        result = await conn.execute(sql)
        rows = await result.fetchall()

    return [
        {
            "category": row[0],
            "total_amount": float(row[1]),
            "transaction_count": row[2],
        }
        for row in rows
    ]


async def get_monthly_trend() -> list[dict]:
    """
    Monthly spend trend (for trend chart).
    Returns [{month, total_amount, transaction_count}].
    """
    sql = """
        SELECT TO_CHAR(txn_date, 'YYYY-MM') AS month,
               SUM(amount)::NUMERIC(14,2) AS total_amount,
               COUNT(*) AS transaction_count
        FROM transactions
        WHERE status = 'success' AND amount > 0
        GROUP BY TO_CHAR(txn_date, 'YYYY-MM')
        ORDER BY month ASC
    """
    async with get_connection() as conn:
        result = await conn.execute(sql)
        rows = await result.fetchall()

    return [
        {
            "month": row[0],
            "total_amount": float(row[1]),
            "transaction_count": row[2],
        }
        for row in rows
    ]


async def get_summary_stats() -> dict:
    """Summary statistics for the dashboard."""
    sql = """
        SELECT
            COUNT(*) AS total_transactions,
            SUM(CASE WHEN status = 'success' AND amount > 0 THEN amount ELSE 0 END)::NUMERIC(14,2) AS total_spend,
            COUNT(CASE WHEN status = 'success' THEN 1 END) AS success_count,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
        FROM transactions
    """
    async with get_connection() as conn:
        result = await conn.execute(sql)
        row = await result.fetchone()

    return {
        "total_transactions": row[0],
        "total_spend": float(row[1]),
        "success_count": row[2],
        "failed_count": row[3],
        "pending_count": row[4],
    }
