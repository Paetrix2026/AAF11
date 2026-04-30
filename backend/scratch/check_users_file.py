
import asyncio
import os
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from utils.db import get_pool

async def check_users():
    pool = await get_pool()
    async with pool.acquire() as conn:
        users = await conn.fetch("SELECT id, email, name, role FROM users")
        with open("users_result.txt", "w") as f:
            f.write(f"Users in DB: {len(users)}\n")
            for u in users:
                f.write(f"- {u['name']} ({u['email']}) : {u['role']}\n")

if __name__ == "__main__":
    asyncio.run(check_users())
