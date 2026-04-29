import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from pathlib import Path

# Load env from backend
load_dotenv(Path("backend/.env"))

async def check_users():
    database_url = os.getenv("DATABASE_URL")
    print(f"Connecting to: {database_url.split('@')[-1]}")
    conn = await asyncpg.connect(database_url)
    try:
        rows = await conn.fetch("SELECT id, email, role, name, LEFT(password_hash, 10) as hash_start FROM users")
        print("\n=== Current Users in DB ===")
        for row in rows:
            print(f"ID: {row['id']}")
            print(f"Email: {row['email']}")
            print(f"Role: {row['role']}")
            print(f"Name: {row['name']}")
            print(f"Hash Start: {row['hash_start']}...")
            print("-" * 20)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_users())
