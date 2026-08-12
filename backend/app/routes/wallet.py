"""
Wallet route.

GET /wallet — current coin balance
"""

from fastapi import APIRouter
from app.services.rewards_service import get_wallet_balance
from app.models.wallet import WalletResponse

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=WalletResponse)
async def wallet():
    """Get the user's wallet balance."""
    data = await get_wallet_balance()
    return WalletResponse(**data)
