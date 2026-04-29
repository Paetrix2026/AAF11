import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  telegramHandle: text("telegram_handle"),
  alertOptIn: boolean("alert_opt_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  doctorId: uuid("doctor_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  location: text("location"),
  conditions: jsonb("conditions").$type<string[]>().default([]),
  medications: jsonb("medications")
    .$type<{ name: string; dose: string; since: string }[]>()
    .default([]),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id),
  doctorId: uuid("doctor_id").references(() => users.id),
  pathogen: text("pathogen").notNull(),
  variant: text("variant"),
  status: text("status").default("running"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outcomes = pgTable("outcomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").references(() => pipelineRuns.id),
  patientId: uuid("patient_id").references(() => patients.id),
  recommendedDrug: text("recommended_drug"),
  outcome: text("outcome"),
  outcomeScore: integer("outcome_score"),
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetId: uuid("target_id").notNull(),
  targetType: text("target_type").notNull(),
  alertType: text("alert_type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
