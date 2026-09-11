import { getDb, hasDatabase } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

/* Readers subscribe from their phone, so this is deliberately open — there is
   no account behind a newsletter reader. A push endpoint is useless to anyone
   but the browser that owns it, so storing one grants no access to anything. */

export const dynamic = "force-dynamic";

const subscription = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().max(500),
    auth: z.string().max(500),
  }),
});

export async function POST(req: Request) {
  if (!hasDatabase())
    return Response.json(
      { error: "Notifications need a database. Set DATABASE_URL." },
      { status: 503 },
    );

  let body: z.infer<typeof subscription>;
  try {
    body = subscription.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    await getDb()
      .insert(pushSubscriptions)
      .values({
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        created: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: body.keys.p256dh, auth: body.keys.auth },
      });
    return Response.json({ subscribed: true });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  if (!hasDatabase())
    return Response.json({ error: "No database" }, { status: 503 });
  const { endpoint } = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  if (!endpoint)
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  await getDb()
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return Response.json({ unsubscribed: true });
}

/** How many devices are signed up, so the studio can show a count. */
export async function GET() {
  if (!hasDatabase()) return Response.json({ count: 0, ready: false });
  try {
    const rows = await getDb().select().from(pushSubscriptions);
    return Response.json({ count: rows.length, ready: true });
  } catch {
    return Response.json({ count: 0, ready: false });
  }
}
