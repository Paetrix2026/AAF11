
import asyncio
import os
from dotenv import load_dotenv
import asyncpg

# Load .env from backend directory
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def push_schema():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set")
        return

    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Pushing schema...")
        # Enable pgcrypto for gen_random_uuid() if needed
        await conn.execute("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";")
        
        # Create users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'patient',
                alert_opt_in BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create patients table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                doctor_id UUID REFERENCES users(id),
                name TEXT NOT NULL,
                age INT,
                gender TEXT,
                location TEXT,
                conditions JSONB DEFAULT '[]'::jsonb,
                medications JSONB DEFAULT '[]'::jsonb,
                status TEXT DEFAULT 'stable',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("✅ Schema pushed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(push_schema())
