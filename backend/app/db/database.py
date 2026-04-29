import asyncpg
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Neon connection details from URL
DATABASE_URL = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

class NeonDB:
    def __init__(self):
        self.pool = None

    async def connect(self):
        if not self.pool:
            try:
                self.pool = await asyncpg.create_pool(DATABASE_URL)
                logger.info("Connected to Neon PostgreSQL")
            except Exception as e:
                logger.error(f"Failed to connect to Neon: {e}")
                raise e

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def fetch_one(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetch_all(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query, *args):
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

db_pool = NeonDB()

async def init_db():
    await db_pool.connect()

async def get_db():
    if not db_pool.pool:
        await db_pool.connect()
    async with db_pool.pool.acquire() as conn:
        yield conn
