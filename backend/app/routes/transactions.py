"""
Transaction routes.

GET /transactions  — paginated, filtered, sorted list
GET /transactions/{id}  — single transaction detail
GET /transactions/analytics/categories  — category breakdown (cached)
GET /transactions/analytics/trend  — monthly trend (cached)
GET /transactions/analytics/summary  — summary stats (cached)
"""

from fastapi import APIRouter, HTTPException, Query
from app.services import transaction_service
from app.models.transaction import TransactionListResponse, TransactionResponse
from app.cache.redis_client import (
    get_cached, set_cached,
    CATEGORY_BREAKDOWN_KEY, CATEGORY_BREAKDOWN_TTL,
    MONTHLY_TREND_KEY, MONTHLY_TREND_TTL,
    SUMMARY_STATS_KEY, SUMMARY_STATS_TTL,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    status: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    amount_min: float | None = Query(None),
    amount_max: float | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("txn_date"),
    sort_dir: str = Query("desc"),
):
    """List transactions with filtering, sorting, and pagination."""
    return await transaction_service.list_transactions(
        page=page,
        limit=limit,
        category=category,
        status=status,
        date_from=date_from,
        date_to=date_to,
        amount_min=amount_min,
        amount_max=amount_max,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.get("/analytics/categories")
async def category_breakdown():
    """Category-wise spend aggregation (cached)."""
    cached = await get_cached(CATEGORY_BREAKDOWN_KEY)
    if cached is not None:
        return {"data": cached, "cached": True}

    data = await transaction_service.get_category_breakdown()
    await set_cached(CATEGORY_BREAKDOWN_KEY, data, CATEGORY_BREAKDOWN_TTL)
    return {"data": data, "cached": False}


@router.get("/analytics/trend")
async def monthly_trend():
    """Monthly spend trend (cached)."""
    cached = await get_cached(MONTHLY_TREND_KEY)
    if cached is not None:
        return {"data": cached, "cached": True}

    data = await transaction_service.get_monthly_trend()
    await set_cached(MONTHLY_TREND_KEY, data, MONTHLY_TREND_TTL)
    return {"data": data, "cached": False}


@router.get("/analytics/summary")
async def summary_stats():
    """Dashboard summary statistics (cached)."""
    cached = await get_cached(SUMMARY_STATS_KEY)
    if cached is not None:
        return {"data": cached, "cached": True}

    data = await transaction_service.get_summary_stats()
    await set_cached(SUMMARY_STATS_KEY, data, SUMMARY_STATS_TTL)
    return {"data": data, "cached": False}


@router.get("/{txn_id}", response_model=TransactionResponse)
async def get_transaction(txn_id: str):
    """Get a single transaction by ID."""
    txn = await transaction_service.get_transaction_by_id(txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn
