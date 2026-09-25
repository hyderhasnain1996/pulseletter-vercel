import { getDb, hasDatabase } from "@/db";
import { users, appCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, PASSWORD_MIN } from "../../../lib/password";

/* Making an account.

   Two rows: the Auth.js user, and the password that belongs to it. They are
   written in that order because the credential points at the user; if the
   second write fails the first is removed again, so a half-made account can
   never block the address from being used later. */

const payload = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  password: z.string().min(PASSWORD_MIN).max(200),
});

export async function POST(req: Request) {
  if (!hasDatabase())
    return Response.json(
      { error: "no-database", message: "Accounts need a database." },
      { status: 503 },
    );

  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return Response.json({ error: "bad-origin" }, { status: 403 });

  let body: z.infer<typeof payload>;
  try {
    body = payload.parse(await req.json());
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const email = body.email.toLowerCase();
  const db = getDb();

  const taken = await db
    .select({ userId: appCredentials.userId })
    .from(appCredentials)
    .where(eq(appCredentials.email, email))
    .limit(1);
  if (taken.length) return Response.json({ error: "taken" }, { status: 409 });

  const id = crypto.randomUUID();
  await db.insert(users).values({ id, name: body.name, email });
  try {
    await db.insert(appCredentials).values({
      userId: id,
      email,
      passwordHash: await hashPassword(body.password),
      created: new Date().toISOString(),
    });
  } catch (err) {
    await db.delete(users).where(eq(users.id, id));
    /* A second request that got here first is the ordinary cause, and the
       answer is the same one it would have had a moment earlier. */
    const message = err instanceof Error ? err.message : "";
    if (/unique|duplicate/i.test(message))
      return Response.json({ error: "taken" }, { status: 409 });
    return Response.json({ error: "failed" }, { status: 500 });
  }

  /* The browser signs in straight afterwards with these same details, so
     there is nothing to hand back but the go-ahead. */
  return Response.json({ ok: true, email });
}
