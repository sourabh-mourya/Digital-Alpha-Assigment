"""
Database connection pool using psycopg (v3, async).
"""

import sys
import asyncio
import os
from pathlib import Path
from contextlib import asynccontextmanager

import psycopg
from psycopg_pool import AsyncConnectionPool
from dotenv import load_dotenv

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://da_user:da_pass_local@localhost:5432/digital_alpha")

_pool: AsyncConnectionPool | None = None


async def init_pool() -> None:
    """Initialize the async connection pool. Call once at app startup."""
    global _pool
    _pool = AsyncConnectionPool(
        conninfo=DATABASE_URL,
        min_size=2,
        max_size=10,
        open=False,
    )
    await _pool.open()


async def close_pool() -> None:
    """Close the connection pool. Call at app shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection():
    """Yield a connection from the pool."""
    if _pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")
    async with _pool.connection() as conn:
        yield conn


@asynccontextmanager
async def get_cursor():
    """Yield a cursor from a pooled connection (auto-commits on success)."""
    async with get_connection() as conn:
        async with conn.cursor() as cur:
            yield cur


def get_sync_connection():
    """Get a synchronous connection for seed scripts and migrations."""
    return psycopg.connect(DATABASE_URL)
