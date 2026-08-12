"""
Rewards service — handles redemption with transactional safety.
Uses SELECT ... FOR UPDATE to prevent double-redeem race conditions.
"""

from app.db.connection import get_connection
from app.models.rewards import RewardItem, RedemptionResponse


async def get_all_rewards() -> list[RewardItem]:
    """Fetch the rewards catalogue."""
    sql = "SELECT id, name, description, coin_cost FROM rewards_catalogue ORDER BY coin_cost ASC"
    async with get_connection() as conn:
        result = await conn.execute(sql)
        rows = await result.fetchall()

    return [
        RewardItem(id=row[0], name=row[1], description=row[2], coin_cost=row[3])
        for row in rows
    ]


async def get_wallet_balance() -> dict:
    """Fetch the user's wallet balance."""
    sql = "SELECT id, coin_balance FROM user_wallet LIMIT 1"
    async with get_connection() as conn:
        result = await conn.execute(sql)
        row = await result.fetchone()

    if not row:
        return {"id": 0, "coin_balance": 0}

    return {"id": row[0], "coin_balance": row[1]}


async def redeem_reward(reward_id: int) -> RedemptionResponse:
    """
    Redeem a reward. Uses a DB transaction with row-level locking
    to prevent double-redeem race conditions.

    Flow:
    1. Check reward exists → 404 if not
    2. Lock wallet row with SELECT ... FOR UPDATE
    3. Check balance sufficient → log failed attempt + 400 if not
    4. Debit balance, insert confirmed redemption
    5. Return new balance

    Raises ValueError with status code info on failure.
    """
    async with get_connection() as conn:
        # We need explicit transaction control
        async with conn.transaction():
            # 1. Check reward exists
            reward_result = await conn.execute(
                "SELECT id, name, description, coin_cost FROM rewards_catalogue WHERE id = $1",
                [reward_id],
            )
            reward_row = await reward_result.fetchone()

            if not reward_row:
                raise ValueError("REWARD_NOT_FOUND")

            reward_name = reward_row[1]
            coin_cost = reward_row[3]

            # 2. Lock wallet row (prevents concurrent double-redeem)
            wallet_result = await conn.execute(
                "SELECT id, coin_balance FROM user_wallet LIMIT 1 FOR UPDATE",
            )
            wallet_row = await wallet_result.fetchone()

            if not wallet_row:
                raise ValueError("WALLET_NOT_FOUND")

            wallet_id = wallet_row[0]
            current_balance = wallet_row[1]

            # 3. Check balance
            if current_balance < coin_cost:
                # Log the failed attempt
                failed_result = await conn.execute(
                    """INSERT INTO redemptions (reward_id, coins_spent, status)
                       VALUES ($1, $2, 'failed')
                       RETURNING id, created_at""",
                    [reward_id, coin_cost],
                )
                failed_row = await failed_result.fetchone()

                raise ValueError("INSUFFICIENT_BALANCE")

            # 4. Debit balance
            new_balance = current_balance - coin_cost
            await conn.execute(
                "UPDATE user_wallet SET coin_balance = $1 WHERE id = $2",
                [new_balance, wallet_id],
            )

            # 5. Log confirmed redemption
            redeem_result = await conn.execute(
                """INSERT INTO redemptions (reward_id, coins_spent, status)
                   VALUES ($1, $2, 'confirmed')
                   RETURNING id, created_at""",
                [reward_id, coin_cost],
            )
            redeem_row = await redeem_result.fetchone()

            return RedemptionResponse(
                id=str(redeem_row[0]),
                reward_id=reward_id,
                reward_name=reward_name,
                coins_spent=coin_cost,
                status="confirmed",
                new_balance=new_balance,
                created_at=redeem_row[1],
            )
