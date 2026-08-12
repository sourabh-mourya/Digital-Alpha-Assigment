# Technical Architecture & Architectural Decisions

This document outlines technical design choices, trade-offs, and system architecture.

---

## 1. Raw Async SQL vs ORM (psycopg v3 + FastAPI)
- **Decision**: Used `psycopg` (v3 async connection pool) with raw SQL queries instead of heavy ORM abstractions like SQLAlchemy ORM or Tortoise.
- **Rationale**: For analytics, aggregations over 10,000+ rows, and transaction-safe operations (`SELECT ... FOR UPDATE`), raw SQL provides complete visibility into execution plans, eliminates ORM hydration overhead, and avoids subtle query N+1 pitfalls.

## 2. Redis Caching Strategy
- **Decision**:
  - `GET /rewards` -> Cached with 10-minute TTL (`rewards:catalogue`). Catalogue updates rarely.
  - Category spend breakdown & monthly trends -> Cached with 5-minute TTL (`analytics:category_breakdown`, `analytics:monthly_trend`).
  - Wallet balance -> NOT cached. Balance must always reflect strict real-time state for balance validation.
- **Rationale**: Reduces DB CPU load during heavy analytical queries while ensuring transaction consistency on user balances.

## 3. Frontend State & URL Navigation
- **Decision**: Synchronized table filters, sorting, and pagination directly with React state and URL search params.
- **Rationale**: Makes table state shareable and bookmarkable without complex global state managers (Redux/Zustand).

---

## 4. What I'd add at production scale (not implemented here)

### Nginx Reverse Proxy
A dedicated Nginx reverse proxy would sit in front of the FastAPI application servers to terminate TLS/SSL certificates, buffer slow client connections, and handle gzip/brotli compression before traffic touches Python. At scale, Nginx offloads static asset serving and protects application workers from direct public exposure, freeing worker threads for core business logic. In our current single-instance deployment, cloud platforms (Render/Vercel) automatically provide edge proxying, making a custom Nginx container redundant for single-user demonstration.

### Load Balancer
As incoming traffic grows beyond the capacity of a single FastAPI process, an external layer 7 load balancer (e.g., AWS ALB or Nginx upstream balancer) would distribute requests across multiple stateless FastAPI app replicas using round-robin or least-connection algorithms. This ensures high availability and zero-downtime rolling deployments across regions. At our current scale (demo project with single-digit concurrent requests), a load balancer is unnecessary over-engineering.

### Connection Pooling (PgBouncer)
Direct database connection pools per application process can quickly exhaust PostgreSQL's max connection limits when scaling horizontally across 10+ backend containers. Inserting PgBouncer in transaction-pooling mode between FastAPI and PostgreSQL reuses a small set of physical DB connections across thousands of concurrent client sessions. In our current setup, `psycopg_pool.AsyncConnectionPool` efficiently manages 1-10 connections directly.

### Horizontal Scaling
To scale beyond a single node, we would run multiple stateless FastAPI replicas behind the load balancer, connected to a managed Redis cluster (ElastiCache/Upstash) and a PostgreSQL database with read-replicas for query offloading. Writes and transaction redemptions would hit the primary DB node while read-heavy analytical dashboards query read replicas.
