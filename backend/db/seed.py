#!/usr/bin/env python3
"""
Healynx Database Seed Script (Python/bcrypt version)

Run from backend/ directory:
    python db/seed.py

Requires DATABASE_URL in backend/.env

Creates:
- Demo doctor account:   doctor@healynx.ai / demo1234
- Demo patient account 1: arjun@healynx.ai / demo1234  (Type 2 Diabetes, Hypertension)
- Demo patient account 2: priya@healynx.ai / demo1234   (Asthma, Iron-Deficiency Anaemia)
- Patient record for Rohan Verma (no login, doctor-managed only)

IMPORTANT: This uses bcrypt for password hashing, compatible with the
FastAPI auth system. The TypeScript seed.ts uses scrypt (not compatible).
Use this script for the actual demo.
"""

import asyncio
import os
import sys
import json
from pathlib import Path

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


# ---------------------------------------------------------------------------
# Patient users – these get BOTH a users row AND a patients row.
# The patients.user_id links the auth account to the clinical record.
# ---------------------------------------------------------------------------
PATIENT_USERS = [
    {
        # Auth credentials
        "email": "arjun@healynx.ai",
        "password": "demo1234",
        "name": "Arjun Mehta",
        # Clinical record
        "age": 45,
        "gender": "M",
        "location": "Delhi, India",
        "conditions": ["Type 2 Diabetes", "Hypertension"],
        "medications": [
            {"name": "Oseltamivir", "dose": "75mg",  "since": "2025-01-10"},
            {"name": "Metformin",   "dose": "500mg", "since": "2023-06-15"},
            {"name": "Amlodipine",  "dose": "5mg",   "since": "2022-11-01"},
        ],
        "status": "critical",
    },
    {
        # Auth credentials
        "email": "priya@healynx.ai",
        "password": "demo1234",
        "name": "Priya Sharma",
        # Clinical record
        "age": 32,
        "gender": "F",
        "location": "Mumbai, India",
        "conditions": ["Asthma", "Iron-Deficiency Anaemia"],
        "medications": [
            {"name": "Baloxavir",    "dose": "40mg",  "since": "2025-02-01"},
            {"name": "Salbutamol",   "dose": "100mcg","since": "2021-03-20"},
            {"name": "Ferrous Sulfate", "dose": "200mg", "since": "2024-07-05"},
        ],
        "status": "active",
    },
]

# Rohan has no login account – managed directly by the doctor
DOCTOR_ONLY_PATIENTS = [
    {
        "name": "Rohan Verma",
        "age": 58,
        "gender": "M",
        "location": "Bangalore, India",
        "conditions": ["COPD", "Chronic Kidney Disease Stage 3"],
        "medications": [
            {"name": "Oseltamivir",  "dose": "75mg",  "since": "2024-12-15"},
            {"name": "Tiotropium",   "dose": "18mcg", "since": "2023-09-10"},
        ],
        "status": "stable",
    },
]


async def seed():
    print("🌱 Starting Healynx seed...\n")
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # ------------------------------------------------------------------
        # 1. Doctor account
        # ------------------------------------------------------------------
        doctor_email = "doctor@healynx.ai"
        existing_doctor = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", doctor_email
        )

        if existing_doctor:
            doctor_id = str(existing_doctor["id"])
            print(f"✅ Doctor already exists: {doctor_email} (id: {doctor_id[:8]}…)")
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
            print(f"🆕 Created doctor:  {doctor_email}  (id: {doctor_id[:8]}…)")

        # ------------------------------------------------------------------
        # 2. Patient user accounts  (users + patients rows)
        # ------------------------------------------------------------------
        for pu in PATIENT_USERS:
            # --- users row ---
            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1", pu["email"]
            )
            if existing_user:
                patient_user_id = str(existing_user["id"])
                print(f"✅ Patient user already exists: {pu['email']} (id: {patient_user_id[:8]}…)")
            else:
                u_row = await conn.fetchrow(
                    """
                    INSERT INTO users (email, password_hash, name, role, alert_opt_in)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                    """,
                    pu["email"],
                    hash_password(pu["password"]),
                    pu["name"],
                    "patient",
                    True,
                )
                patient_user_id = str(u_row["id"])
                print(f"🆕 Created patient user: {pu['email']}  (id: {patient_user_id[:8]}…)")

            # --- patients row ---
            existing_patient = await conn.fetchrow(
                "SELECT id FROM patients WHERE user_id = $1::uuid", patient_user_id
            )
            if existing_patient:
                print(f"   ↳ Patient record already linked: {pu['name']}")
            else:
                p_row = await conn.fetchrow(
                    """
                    INSERT INTO patients
                        (user_id, doctor_id, name, age, gender, location,
                         conditions, medications, status)
                    VALUES
                        ($1::uuid, $2::uuid, $3, $4, $5, $6,
                         $7::jsonb, $8::jsonb, $9)
                    RETURNING id
                    """,
                    patient_user_id,
                    doctor_id,
                    pu["name"],
                    pu["age"],
                    pu["gender"],
                    pu["location"],
                    json.dumps(pu["conditions"]),
                    json.dumps(pu["medications"]),
                    pu["status"],
                )
                print(f"   ↳ Created patient record: {pu['name']} (id: {str(p_row['id'])[:8]}…)")

        # ------------------------------------------------------------------
        # 3. Doctor-only patient (no login account)
        # ------------------------------------------------------------------
        for dp in DOCTOR_ONLY_PATIENTS:
            existing_patient = await conn.fetchrow(
                "SELECT id FROM patients WHERE name = $1 AND doctor_id = $2::uuid",
                dp["name"], doctor_id,
            )
            if existing_patient:
                print(f"✅ Doctor-only patient already exists: {dp['name']}")
                continue

            dp_row = await conn.fetchrow(
                """
                INSERT INTO patients
                    (doctor_id, name, age, gender, location,
                     conditions, medications, status)
                VALUES
                    ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
                RETURNING id
                """,
                doctor_id,
                dp["name"],
                dp["age"],
                dp["gender"],
                dp["location"],
                json.dumps(dp["conditions"]),
                json.dumps(dp["medications"]),
                dp["status"],
            )
            print(f"🆕 Created doctor-only patient: {dp['name']} (id: {str(dp_row['id'])[:8]}…)")

        # ------------------------------------------------------------------
        # Done
        # ------------------------------------------------------------------
        print("\n✅ Seed complete!\n")
        print("━" * 50)
        print("📋 Demo Login Credentials")
        print("━" * 50)
        print("  DOCTOR")
        print("    email:    doctor@healynx.ai")
        print("    password: demo1234\n")
        print("  PATIENT 1  — Arjun Mehta (Diabetes, Hypertension)")
        print("    email:    arjun@healynx.ai")
        print("    password: demo1234\n")
        print("  PATIENT 2  — Priya Sharma (Asthma, Anaemia)")
        print("    email:    priya@healynx.ai")
        print("    password: demo1234")
        print("━" * 50)

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
