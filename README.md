# Digital-Alpha-Assigment

## Project Status
This is a full-stack credit-card rewards dashboard built with Next.js, FastAPI, PostgreSQL, and Redis.

### Technologies
- Frontend: Next.js + React + TypeScript + Vanilla CSS Modules
- Backend: FastAPI (Python)
- Database: PostgreSQL (with psycopg, raw SQL)
- Cache: Redis

### Setup
1. Backend
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate
   pip install -r requirements.txt
   ```
2. Frontend
   ```bash
   cd frontend
   npm install
   ```
3. Docker (DB + Redis)
   ```bash
   docker-compose up -d
   ```
4. Database Seed
   ```bash
   cd backend
   python -m app.db.seed
   ```
