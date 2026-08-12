"""
Digital Alpha Rewards Dashboard — FastAPI Backend

Entry point: uvicorn app.main:app --reload
"""

import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

from app.db.connection import init_pool, close_pool
from app.cache.redis_client import init_redis, close_redis
from app.routes import transactions, wallet, rewards


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB pool and Redis on startup, close on shutdown."""
    print("-> Starting up...")
    await init_pool()
    await init_redis()
    print("-> App ready")
    yield
    print("-> Shutting down...")
    await close_pool()
    await close_redis()
    print("-> Shutdown complete")


app = FastAPI(
    title="Digital Alpha Rewards API",
    description="Credit-card rewards dashboard backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,https://digital-alpha-assigment.vercel.app"
)
cors_origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(transactions.router)
app.include_router(wallet.router)
app.include_router(rewards.router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
