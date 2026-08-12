"""
Digital Alpha Rewards Dashboard — FastAPI Backend

Entry point: uvicorn app.main:app --reload
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db.connection import init_pool, close_pool
from app.cache.redis_client import init_redis, close_redis
from app.routes import transactions, wallet, rewards

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB pool and Redis on startup, close on shutdown."""
    print("→ Starting up...")
    await init_pool()
    await init_redis()
    print("✓ App ready")
    yield
    print("→ Shutting down...")
    await close_pool()
    await close_redis()
    print("✓ Shutdown complete")


app = FastAPI(
    title="Digital Alpha Rewards API",
    description="Credit-card rewards dashboard backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
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
