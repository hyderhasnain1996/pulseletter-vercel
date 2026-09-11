import webpush from "web-push";
import { getUser } from "../../../session";
import { getDb, hasDatabase } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";

/* Sending a notification to every subscribed phone.

   Push costs nothing: the browser vendors run the delivery, and the VAPID key
   pair is how they know the message really came from this site. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const payload = z.object({
  title: z.string().min(1).max(120),
  body: z.string().max(300),
  url: z.string().max(2000),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey)
    return Response.json(
      {
        error:
          "Notifications are not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
        configured: false,
      },
      { status: 503 },
    );
  if (!hasDatabase())
    return Response.json(
      { error: "Notifications need a database. Set DATABASE_URL.", configured: false },
      { status: 503 },
    );

  let message: z.infer<typeof payload>;
  try {
    message = payload.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:newsletter@example.com",
    publicKey,
    privateKey,
  );

  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);
  if (!subs.length)
    return Response.json({ configured: true, sent: 0, failed: 0, results: [] });

  const body = JSON.stringify(message);
  const gone: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        // 404/410 mean the device unsubscribed or the browser was removed.
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) gone.push(s.endpoint);
      }
    }),
  );

  // Drop dead endpoints so the list stays honest.
  if (gone.length)
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.endpoint, gone));

  return Response.json({
    configured: true,
    sent,
    failed: subs.length - sent,
    removed: gone.length,
  });
}
