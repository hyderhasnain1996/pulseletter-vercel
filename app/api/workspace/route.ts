import { getUser } from "../../session";
import { initial, State } from "../../data";
import { getDb, hasDatabase } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
const str = z.string().max(10000);
const issue = z.object({
  id: str,
  title: str,
  category: str,
  status: z.enum(["Draft", "Ready", "Archived"]),
  updated: str,
  issue: str,
  public: z.literal(false),
  theme: z.string().max(30).optional(),
  layout: z.string().max(30).optional(),
  blocks: z
    .array(
      z.object({
        id: str,
        type: str,
        text: str,
        // Inlined image data URL, or an https link to an image or video.
        src: z
          .string()
          .max(1000000)
          .refine(
            (v) =>
              v === "" ||
              v.startsWith("data:image/") ||
              /^https?:\/\//.test(v),
            "Unsupported media source",
          )
          .optional(),
      }),
    )
    .max(100),
});
const contact = z.object({
  id: str,
  name: str,
  email: z.string().email(),
  phone: str,
  group: str,
  subscribed: z.boolean(),
  smsSubscribed: z.boolean().optional(),
});
const schema = z.object({
  brand: z.string().min(1).max(80),
  issues: z.array(issue).max(500),
  contacts: z.array(contact).max(10000),
  campaigns: z
    .array(
      z.object({
        id: str,
        title: str,
        issueId: str,
        channel: z.enum(["Email", "SMS"]),
        date: str,
        status: z.enum(["Draft (demo)", "Scheduled (demo)", "Canceled"]),
        snapshot: issue,
        recipients: z.array(contact),
      }),
    )
    .max(500),
  automations: z
    .array(
      z.object({
        id: str,
        name: str,
        frequency: str,
        paused: z.boolean(),
        issueId: str.optional(),
        channel: str.optional(),
        group: str.optional(),
        recipients: z.array(str).max(500).optional(),
        lastRun: str.optional(),
        nextRun: str.optional(),
        lastResult: str.optional(),
      }),
    )
    .max(100),
});
export async function GET() {
  const user = await getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    if (!hasDatabase()) throw Error();
    const rows = await getDb()
      .select()
      .from(workspaces)
      .where(eq(workspaces.owner, user.userId))
      .limit(1);
    return Response.json(rows[0] ? JSON.parse(rows[0].data) : initial, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "Workspace storage is unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const body = await req.text();
  if (body.length > 2000000)
    return Response.json({ error: "Workspace too large" }, { status: 413 });
  let next: State;
  try {
    next = schema.parse(JSON.parse(body));
  } catch {
    return Response.json({ error: "Invalid workspace data" }, { status: 400 });
  }
  try {
    if (!hasDatabase()) throw Error();
    const db = getDb();
    const rows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.owner, user.userId))
      .limit(1);
    const previous: State = rows[0] ? JSON.parse(rows[0].data) : initial;
    // Historical snapshots and recipients are immutable, even if clients submit changes.
    next.campaigns = next.campaigns.map((c) => {
      const old = previous.campaigns.find((p) => p.id === c.id);
      if (old)
        return {
          ...old,
          status: c.status === "Canceled" ? "Canceled" : old.status,
        };
      const source = next.issues.find((i) => i.id === c.issueId);
      if (!source) throw Error("Unknown newsletter");
      return {
        ...c,
        snapshot: structuredClone(source),
        recipients: next.contacts.filter(
          (p) =>
            c.recipients.some((r) => r.id === p.id) &&
            (c.channel === "Email" ? p.subscribed : p.smsSubscribed === true) &&
            (c.channel === "Email" ? p.email : p.phone),
        ),
      };
    });
    for (const old of previous.campaigns)
      if (!next.campaigns.some((c) => c.id === old.id))
        next.campaigns.push(old);
    const row = {
      owner: user.userId,
      data: JSON.stringify(next),
      updated: new Date().toISOString(),
    };
    await db
      .insert(workspaces)
      .values(row)
      .onConflictDoUpdate({
        target: workspaces.owner,
        set: { data: row.data, updated: row.updated },
      });
    return Response.json({ saved: true });
  } catch {
    return Response.json(
      { error: "Unable to save workspace" },
      { status: 503 },
    );
  }
}
