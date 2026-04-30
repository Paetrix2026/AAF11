
import asyncio
import os
from dotenv import load_dotenv
from auth.hashing import hash_password

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from utils.db import get_pool

async def seed_users():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Create users table if not exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'patient'
            )
        """)
        
        # Add patient user if not exists
        patient_email = "patient@healynx.ai"
        patient_exists = await conn.fetchval("SELECT id FROM users WHERE email = $1", patient_email)
        if not patient_exists:
            pw_hash = hash_password("password")
            await conn.execute("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES ($1, $2, $3, $4)
            """, patient_email, pw_hash, "Patient Zero", "patient")
            print(f"[+] Added patient user: {patient_email}")
        else:
            print(f"[!] Patient user already exists: {patient_email}")

        # Add doctor user if not exists
        doctor_email = "doctor@healynx.ai"
        doctor_exists = await conn.fetchval("SELECT id FROM users WHERE email = $1", doctor_email)
        if not doctor_exists:
            pw_hash = hash_password("password")
            await conn.execute("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES ($1, $2, $3, $4)
            """, doctor_email, pw_hash, "Dr. Rafan", "doctor")
            print(f"[+] Added doctor user: {doctor_email}")
        else:
            print(f"[!] Doctor user already exists: {doctor_email}")

if __name__ == "__main__":
    asyncio.run(seed_users())
