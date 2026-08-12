import sys
import asyncio
from pathlib import Path

# Explicitly set WindowsSelectorEventLoopPolicy for Windows BEFORE uvicorn/psycopg initializes
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
