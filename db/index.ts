import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/* Postgres over HTTP, which works on Vercel's serverless runtime without
   connection pooling headaches.

   Vercel's Neon integration supplies POSTGRES_URL rather than DATABASE_URL,
   so both names are accepted and whichever exists is used. */
export function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

export const hasDatabase = () => Boolean(databaseUrl());

export function getDb() {
  const url = databaseUrl();
  if (!url)
    throw new Error(
      "No database connection string. Set DATABASE_URL or POSTGRES_URL.",
    );
  return drizzle(neon(url), { schema });
}
