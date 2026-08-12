"""Pydantic schemas for transactions."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class TransactionResponse(BaseModel):
    """Single transaction in API response."""
    id: str
    merchant_name: str
    category: str
    amount: Decimal
    currency: str
    payment_method: str
    status: str
    txn_date: datetime
    created_at: datetime


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    limit: int
    total: int
    total_pages: int


class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""
    data: list[TransactionResponse]
    pagination: PaginationMeta


class TransactionFilters(BaseModel):
    """Query parameters for filtering transactions."""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    category: str | None = None
    status: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    amount_min: float | None = None
    amount_max: float | None = None
    search: str | None = None
    sort_by: str = Field(default="txn_date")
    sort_dir: str = Field(default="desc")
