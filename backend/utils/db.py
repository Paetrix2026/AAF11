import asyncpg
import os
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL environment variable not set")
        # Remove query params and SSL settings (asyncpg handles separately)
        dsn = database_url.split("?")[0]
        _pool = await asyncpg.create_pool(
            dsn,
            ssl="require",
            min_size=1,
            max_size=5,
            command_timeout=60,
            max_cached_statement_lifetime=300,
            max_cacheable_statement_size=15000
        )
    return _pool


async def init_db() -> None:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        print("[✓] Connected to Neon PostgreSQL")
    except Exception as e:
        print(f"[!] Database connection failed (non-fatal): {e}")
        print("[!] Backend will run without database. Some features may be unavailable.")
