import { getDb, hasDatabase } from "@/db";
import { workspaces, pushSubscriptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { State, Automation, Issue } from "../../../data";
import {
  sendEmail,
  sendPush,
  issueAsEmail,
  issueAsPush,
} from "../../../lib/deliver";

/* The scheduler.

   Vercel calls this once a day (see vercel.json). It looks at every
   workspace, works out which automations are due, sends them, and writes
   back when each ran and what happened. Nothing else triggers it, so an
   automation cannot fire twice for the same period. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** When an automation should next go out after running at `from`. */
export function nextRunAfter(frequency: string, from: Date): string {
  const d = new Date(from);
  if (frequency === "Daily") {
    d.setUTCDate(d.getUTCDate() + 1);
  } else if (frequency === "Monthly") {
    /* Adding a month to the 31st would overflow into the month after next —
       31 January would become 3 March, skipping February. Clamp to the last
       day the target month actually has. */
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
    ).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
  } else {
    d.setUTCDate(d.getUTCDate() + 7); // Weekly is the default
  }
  d.setUTCHours(9, 0, 0, 0); // a civil hour, in UTC
  return d.toISOString();
}

/** Due when it has never run, or its next run has passed.

    An unreadable date counts as due: otherwise one bad value would stall the
    automation silently and for ever. */
export function isDue(a: Automation, now: Date): boolean {
  if (a.paused) return false;
  if (!a.nextRun) return true;
  const next = Date.parse(a.nextRun);
  if (!Number.isFinite(next)) return true;
  return next <= now.getTime();
}

/** The issue an automation sends: the one chosen, else the newest draft. */
function pickIssue(state: State, a: Automation): Issue | undefined {
  if (a.issueId) {
    const chosen = state.issues.find((i) => i.id === a.issueId);
    if (chosen) return chosen;
  }
  return [...state.issues].sort((x, y) =>
    (y.updated ?? "").localeCompare(x.updated ?? ""),
  )[0];
}

export async function GET(req: Request) {
  /* Vercel signs scheduled requests with CRON_SECRET when it is set. Without
     a secret configured the route refuses rather than running openly. */
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not set, so the scheduler will not run." },
      { status: 503 },
    );
  }
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "No database" }, { status: 503 });
  }

  const origin = process.env.SITE_ORIGIN || `https://${process.env.VERCEL_URL}`;
  const db = getDb();
  const now = new Date();
  const rows = await db.select().from(workspaces);
  const report: Record<string, unknown>[] = [];

  for (const row of rows) {
    let state: State;
    try {
      state = JSON.parse(row.data) as State;
    } catch {
      continue; // unreadable workspace; leave it alone
    }
    if (!state.automations?.length) continue;

    let changed = false;

    for (const a of state.automations) {
      if (!isDue(a, now)) continue;

      const issue = pickIssue(state, a);
      if (!issue) {
        a.lastRun = now.toISOString();
        a.lastResult = "No newsletter to send";
        a.nextRun = nextRunAfter(a.frequency, now);
        changed = true;
        continue;
      }

      let result: string;

      if (a.channel === "Phone alert") {
        const subs = await db.select().from(pushSubscriptions);
        const { sent, gone } = await sendPush(
          subs.map((s) => ({
            endpoint: s.endpoint,
            p256dh: s.p256dh,
            auth: s.auth,
          })),
          issueAsPush(issue, origin),
        );
        if (gone.length)
          await db
            .delete(pushSubscriptions)
            .where(inArray(pushSubscriptions.endpoint, gone));
        result = `Notified ${sent} device${sent === 1 ? "" : "s"}`;
      } else {
        const recipients = state.contacts.filter(
          (c) =>
            c.subscribed &&
            c.email &&
            (!a.group || a.group === "All contacts" || c.group === a.group),
        );
        if (!recipients.length) {
          result = "No subscribed contacts";
        } else {
          const html = issueAsEmail(issue, state.brand, origin);
          let ok = 0;
          let firstError = "";
          for (const c of recipients) {
            const out = await sendEmail(c.email, issue.title, html);
            if (out.ok) ok++;
            else if (!firstError) firstError = out.error ?? "failed";
          }
          result =
            `Emailed ${ok} of ${recipients.length}` +
            (firstError ? ` — ${firstError}` : "");
        }
      }

      a.lastRun = now.toISOString();
      a.lastResult = result;
      a.nextRun = nextRunAfter(a.frequency, now);
      changed = true;
      report.push({ owner: row.owner, automation: a.name, result });
    }

    if (changed) {
      await db
        .update(workspaces)
        .set({ data: JSON.stringify(state), updated: now.toISOString() })
        .where(eq(workspaces.owner, row.owner));
    }
  }

  return Response.json({ ran: report.length, at: now.toISOString(), report });
}
