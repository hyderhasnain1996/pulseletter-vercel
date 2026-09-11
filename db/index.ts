import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/* Postgres over HTTP, which works on Vercel's serverless runtime without
   connection pooling headaches. DATABASE_URL comes from Vercel Postgres or
   Neon; without it the app runs but cannot persist anything. */
export const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}
