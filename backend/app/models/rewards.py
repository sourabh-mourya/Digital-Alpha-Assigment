"""Pydantic schemas for rewards and redemptions."""

from datetime import datetime
from pydantic import BaseModel


class RewardItem(BaseModel):
    """A reward in the catalogue."""
    id: int
    name: str
    description: str | None
    coin_cost: int


class RewardsListResponse(BaseModel):
    """List of available rewards."""
    data: list[RewardItem]


class RedemptionResponse(BaseModel):
    """Response after a redemption attempt."""
    id: str
    reward_id: int
    reward_name: str
    coins_spent: int
    status: str
    new_balance: int
    created_at: datetime
