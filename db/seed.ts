/**
 * Healynx Database Seed Script
 * Run with: npx tsx db/seed.ts
 *
 * Creates the demo doctor account linked to demo patients.
 * Requires DATABASE_URL in .env.local
 *
 * Demo credentials:
 *   Doctor: doctor@healynx.ai / demo1234
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, patients } from "./schema";
import { eq } from "drizzle-orm";
import * as crypto from "node:crypto";

// Load .env.local manually
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && !process.env[key]) {
        process.env[key] = vals.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env.local not found
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

// Simple bcrypt-compatible password hashing using crypto
// For demo purposes — in production use bcrypt
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `$scrypt$${salt}$${hash}`;
}

async function seed() {
  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql, { schema: { users, patients } });

  console.log("🌱 Starting seed...\n");

  // --- Create Doctor ---
  const doctorEmail = "doctor@healynx.ai";
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, doctorEmail))
    .limit(1);

  let doctorId: string;

  if (existing.length > 0) {
    doctorId = existing[0].id;
    console.log(`✓ Doctor already exists: ${doctorEmail} (id: ${doctorId})`);
  } else {
    const [doctor] = await db
      .insert(users)
      .values({
        email: doctorEmail,
        passwordHash: hashPassword("demo1234"),
        name: "Dr. Sarah Chen",
        role: "doctor",
        alertOptIn: true,
      })
      .returning({ id: users.id });

    doctorId = doctor.id;
    console.log(`✓ Created doctor: ${doctorEmail} (id: ${doctorId})`);
  }

  // --- Create Demo Patients ---
  const demoPatients = [
    {
      name: "Arjun Mehta",
      age: 45,
      gender: "M",
      location: "Delhi, India",
      conditions: ["Type 2 Diabetes", "Hypertension"],
      medications: [{ name: "Oseltamivir", dose: "75mg", since: "2025-01-10" }],
      status: "critical" as const,
    },
    {
      name: "Priya Sharma",
      age: 32,
      gender: "F",
      location: "Mumbai, India",
      conditions: [],
      medications: [{ name: "Baloxavir", dose: "40mg", since: "2025-02-01" }],
      status: "active" as const,
    },
    {
      name: "Rohan Verma",
      age: 58,
      gender: "M",
      location: "Bangalore, India",
      conditions: ["COPD"],
      medications: [{ name: "Oseltamivir", dose: "75mg", since: "2024-12-15" }],
      status: "stable" as const,
    },
  ];

  for (const p of demoPatients) {
    const existingPatient = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.name, p.name))
      .limit(1);

    if (existingPatient.length > 0) {
      console.log(`✓ Patient already exists: ${p.name}`);
      continue;
    }

    const [created] = await db
      .insert(patients)
      .values({
        doctorId,
        name: p.name,
        age: p.age,
        gender: p.gender,
        location: p.location,
        conditions: p.conditions,
        medications: p.medications,
        status: p.status,
      })
      .returning({ id: patients.id });

    console.log(`✓ Created patient: ${p.name} (id: ${created.id})`);
  }

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Doctor:  doctor@healynx.ai / demo1234");
  console.log("\n⚠️  Note: Passwords are hashed with scrypt (not bcrypt).");
  console.log("   The Python backend uses bcrypt. Run backend/db/seed.py instead for production seeding.\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
