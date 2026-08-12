"""
Redis caching layer.

Caches:
- rewards:catalogue → TTL 10 min (catalogue rarely changes)
- analytics:category_breakdown → TTL 5 min (aggregation over 10k rows)
- analytics:monthly_trend → TTL 5 min
- analytics:summary → TTL 5 min

NOT cached:
- Wallet balance (changes per redemption)
- Transaction queries (too many unique filter combos)
"""

import json
import os
from typing import Any

import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_client: redis.Redis | None = None


async def init_redis() -> None:
    """Initialize the async Redis client. Call at app startup."""
    global _client
    try:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
        await _client.ping()
        print("✓ Redis connected")
    except Exception as e:
        print(f"⚠ Redis connection failed: {e}")
        print("  Continuing without cache (all queries hit DB directly)")
        _client = None


async def close_redis() -> None:
    """Close the Redis client. Call at app shutdown."""
    global _client
    if _client:
        await _client.close()
        _client = None


async def get_cached(key: str) -> Any | None:
    """Get a cached value by key. Returns None on miss or if Redis unavailable."""
    if not _client:
        return None
    try:
        raw = await _client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception:
        return None


async def set_cached(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Set a cached value with TTL. Silently fails if Redis unavailable."""
    if not _client:
        return
    try:
        await _client.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass  # Cache write failure shouldn't break the app


async def invalidate(key: str) -> None:
    """Delete a cached key. Silently fails if Redis unavailable."""
    if not _client:
        return
    try:
        await _client.delete(key)
    except Exception:
        pass


# ── Cache key constants ──────────────────────────────────────

REWARDS_CATALOGUE_KEY = "rewards:catalogue"
REWARDS_CATALOGUE_TTL = 600  # 10 minutes

CATEGORY_BREAKDOWN_KEY = "analytics:category_breakdown"
CATEGORY_BREAKDOWN_TTL = 300  # 5 minutes

MONTHLY_TREND_KEY = "analytics:monthly_trend"
MONTHLY_TREND_TTL = 300  # 5 minutes

SUMMARY_STATS_KEY = "analytics:summary"
SUMMARY_STATS_TTL = 300  # 5 minutes
