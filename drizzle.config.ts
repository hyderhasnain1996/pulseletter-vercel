import type { Config } from "drizzle-kit";

/* Vercel's Neon integration supplies POSTGRES_URL; a hand-set DATABASE_URL
   also works. Whichever is present is used. */
const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url)
  throw new Error("Set DATABASE_URL or POSTGRES_URL before running drizzle-kit");

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
