"""Pydantic schemas for wallet."""

from pydantic import BaseModel


class WalletResponse(BaseModel):
    """User wallet balance."""
    id: int
    coin_balance: int
