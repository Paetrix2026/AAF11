#!/usr/bin/env python3
"""
Healynx Database Seed Script (Python/bcrypt version)

Run from backend/ directory:
    python db/seed.py

Requires DATABASE_URL in backend/.env

Creates:
- Demo doctor account: doctor@protengine.ai / demo1234
- 3 demo patients linked to the doctor

IMPORTANT: This uses bcrypt for password hashing, compatible with the
FastAPI auth system. The TypeScript seed.ts uses scrypt (not compatible).
Use this script for the actual demo.
"""

import asyncio
import os
import sys
from pathlib import Path

# Load .env from backend directory
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not set in backend/.env")
    sys.exit(1)

import asyncpg
import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


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


async def seed():
    print("🌱 Starting seed...\n")
    conn = await asyncpg.connect(DATABASE_URL)
    import json

    try:
        # Create doctor
        doctor_email = "doctor@protengine.ai"
        existing = await conn.fetchrow("SELECT id FROM users WHERE email=$1", doctor_email)

        if existing:
            doctor_id = str(existing["id"])
            print(f"✓ Doctor already exists: {doctor_email} (id: {doctor_id})")
        else:
            row = await conn.fetchrow(
                """
                INSERT INTO users (email, password_hash, name, role, alert_opt_in)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                doctor_email,
                hash_password("demo1234"),
                "Dr. Sarah Chen",
                "doctor",
                True,
            )
            doctor_id = str(row["id"])
            print(f"✓ Created doctor: {doctor_email} (id: {doctor_id})")

        # Create patients
        for p in DEMO_PATIENTS:
            existing_patient = await conn.fetchrow(
                "SELECT id FROM patients WHERE name=$1 AND doctor_id=$2::uuid",
                p["name"], doctor_id,
            )
            if existing_patient:
                print(f"✓ Patient already exists: {p['name']}")
                continue

            row = await conn.fetchrow(
                """
                INSERT INTO patients (doctor_id, name, age, gender, location, conditions, medications, status)
                VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
                RETURNING id
                """,
                doctor_id,
                p["name"],
                p["age"],
                p["gender"],
                p["location"],
                json.dumps(p["conditions"]),
                json.dumps(p["medications"]),
                p["status"],
            )
            print(f"✓ Created patient: {p['name']} (id: {row['id']})")

        print("\n✅ Seed complete!")
        print("\n📋 Demo Credentials:")
        print("   Doctor:  doctor@protengine.ai / demo1234")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
