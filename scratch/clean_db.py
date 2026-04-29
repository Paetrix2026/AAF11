import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from pathlib import Path

load_dotenv(Path("backend/.env"))

async def clean_db():
    database_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(database_url)
    try:
        # Find the typo doctor
        typo_doctor = await conn.fetchrow("SELECT id FROM users WHERE email = $1", "doctor@protengine.ai")
        if typo_doctor:
            doctor_id = typo_doctor["id"]
            
            # Delete their patients
            deleted_patients = await conn.execute("DELETE FROM patients WHERE doctor_id = $1", doctor_id)
            print(f"Deleted old patients: {deleted_patients}")
            
            # Delete the doctor
            deleted_doctor = await conn.execute("DELETE FROM users WHERE id = $1", doctor_id)
            print(f"Deleted old doctor account: {deleted_doctor}")
        else:
            print("Old doctor account not found.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(clean_db())
