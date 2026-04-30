
import asyncio
import os
import json
import bcrypt
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

DEMO_PATIENTS = [
    {
        "name": "Arjun Mehta",
        "age": 45,
        "gender": "M",
        "location": "Delhi, India",
        "conditions": ["Type 2 Diabetes", "Hypertension"],
        "medications": [{"name": "Oseltamivir", "dose": "75mg", "since": "2025-01-10"}],
        "status": "critical",
    },
    {
        "name": "Priya Sharma",
        "age": 32,
        "gender": "F",
        "location": "Mumbai, India",
        "conditions": [],
        "medications": [{"name": "Baloxavir", "dose": "40mg", "since": "2025-02-01"}],
        "status": "active",
    },
    {
        "name": "Rohan Verma",
        "age": 58,
        "gender": "M",
        "location": "Bangalore, India",
        "conditions": ["COPD"],
        "medications": [{"name": "Oseltamivir", "dose": "75mg", "since": "2024-12-15"}],
        "status": "stable",
    },
]

async def clean_seed():
    conn = await asyncpg.connect(DATABASE_URL)
    print("Starting clean seed...")
    
    try:
        # 1. Create Doctor
        doctor_pwd = bcrypt.hashpw("password".encode(), bcrypt.gensalt()).decode()
        doctor_id = await conn.fetchval("""
            INSERT INTO users (email, password_hash, name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """, "doctor@healynx.ai", doctor_pwd, "Dr. Sarah Chen", "doctor")
        print(f"Created Doctor: doctor@healynx.ai")

        # 2. Create Patient User
        patient_pwd = bcrypt.hashpw("password".encode(), bcrypt.gensalt()).decode()
        await conn.execute("""
            INSERT INTO users (email, password_hash, name, role)
            VALUES ($1, $2, $3, $4)
        """, "patient@healynx.ai", patient_pwd, "Arjun Mehta", "patient")
        print(f"Created Patient User: patient@healynx.ai")

        # 3. Create Patient Records
        for p in DEMO_PATIENTS:
            await conn.execute("""
                INSERT INTO patients (doctor_id, name, age, gender, location, conditions, medications, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, doctor_id, p["name"], p["age"], p["gender"], p["location"], json.dumps(p["conditions"]), json.dumps(p["medications"]), p["status"])
            print(f"Created Patient Record: {p['name']}")

        print("\n[SUCCESS] Clean seed complete!")
        print("Doctor: doctor@healynx.ai / password")
        print("Patient: patient@healynx.ai / password")

    except Exception as e:
        print(f"[ERROR] Error during seed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(clean_seed())
