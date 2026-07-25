import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

const { Pool } = pg;

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[REDACTED_CREDENTIALS]@")
    .replace(/password=[^\s;&]+/gi, "password=[REDACTED]");
}

const connectionString = process.env.DATABASE_URL?.trim();

export const pool = new Pool({
  connectionString: connectionString || "postgresql://localhost:5432/dummy_db",
});

export const db = drizzle(pool, { schema });

export async function ensureTablesExist(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || (!url.startsWith("postgres://") && !url.startsWith("postgresql://"))) {
    const msg =
      "DATABASE_URL environment variable is missing or invalid (must start with postgresql:// or postgres://). " +
      "Please set a valid PostgreSQL connection string in Render environment variables.";
    console.error(`✗ ${msg}`);
    throw new Error(msg);
  }

  try {
    await pool.query("SELECT 1");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "activity" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" text NOT NULL,
        "user_id" text NOT NULL,
        "description" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "rating" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "feedback" (
        "id" serial PRIMARY KEY NOT NULL,
        "message_id" integer NOT NULL,
        "user_id" text NOT NULL,
        "rating" text NOT NULL,
        "comment" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "user_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "theme" text DEFAULT 'system' NOT NULL,
        "model" text DEFAULT 'gemini-2.5-flash' NOT NULL,
        "system_prompt" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
      );
      CREATE INDEX IF NOT EXISTS "activity_user_id_idx" ON "activity" USING btree ("user_id");
      CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations" USING btree ("user_id");
      CREATE INDEX IF NOT EXISTS "feedback_message_id_idx" ON "feedback" USING btree ("message_id");
    `);
    console.log("✓ Database connection verified and tables initialized");
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const safeMsg = `Database initialization failed: ${sanitizeErrorMessage(rawMsg)}`;
    console.error(`✗ ${safeMsg}`);
    throw new Error(safeMsg);
  }
}

export * from "./schema/index";
