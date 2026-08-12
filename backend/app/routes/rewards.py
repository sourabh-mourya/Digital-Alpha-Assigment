"""
Rewards routes.

GET  /rewards          — catalogue (cached in Redis)
POST /rewards/{id}/redeem — redeem a reward (transaction-safe)
"""

from fastapi import APIRouter, HTTPException
from app.services import rewards_service
from app.models.rewards import RewardsListResponse, RedemptionResponse
from app.cache.redis_client import (
    get_cached, set_cached,
    REWARDS_CATALOGUE_KEY, REWARDS_CATALOGUE_TTL,
)

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=RewardsListResponse)
async def list_rewards():
    """Get the rewards catalogue (cached)."""
    cached = await get_cached(REWARDS_CATALOGUE_KEY)
    if cached is not None:
        return RewardsListResponse(data=cached)

    rewards = await rewards_service.get_all_rewards()
    # Cache the serialized list
    await set_cached(
        REWARDS_CATALOGUE_KEY,
        [r.model_dump() for r in rewards],
        REWARDS_CATALOGUE_TTL,
    )
    return RewardsListResponse(data=rewards)


@router.post("/{reward_id}/redeem", response_model=RedemptionResponse)
async def redeem_reward(reward_id: int):
    """
    Redeem a reward.

    - 404: Reward not found
    - 400: Insufficient coin balance
    - 200: Success, returns new balance
    """
    try:
        result = await rewards_service.redeem_reward(reward_id)
        return result
    except ValueError as e:
        error_type = str(e)
        if error_type == "REWARD_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Reward not found")
        elif error_type == "INSUFFICIENT_BALANCE":
            raise HTTPException(
                status_code=400,
                detail="Insufficient coin balance for this reward",
            )
        elif error_type == "WALLET_NOT_FOUND":
            raise HTTPException(status_code=500, detail="Wallet not initialized")
        else:
            raise HTTPException(status_code=500, detail=str(e))
