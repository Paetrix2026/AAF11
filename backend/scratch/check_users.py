
import asyncio
import os
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from utils.db import get_pool

async def check_users():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        """)
        if not table_exists:
            print("Table 'users' does not exist.")
            return
            
        users = await conn.fetch("SELECT id, email, name, role FROM users")
        print(f"Users in DB: {len(users)}")
        for u in users:
            print(f"- {u['name']} ({u['email']}) : {u['role']}")

if __name__ == "__main__":
    asyncio.run(check_users())
