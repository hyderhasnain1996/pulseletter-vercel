import webpush from "web-push";
import type { Issue } from "../data";
import { renderEmail, renderSms, readUrl } from "../render-newsletter";

/* One place that actually delivers something.

   Both the Send panel and the scheduler call these, so a newsletter sent by
   hand and one sent by an automation are identical, and a provider problem shows
   up the same way in both. */

export type Outcome = { to: string; ok: boolean; error?: string };

/** Providers explain their refusals in the body; pass that through. */
async function providerError(res: Response) {
  try {
    const body = (await res.json()) as { message?: string; code?: number };
    if (body?.message)
      return body.code ? `${body.message} (code ${body.code})` : body.message;
  } catch {
    // Not JSON; fall back to the status.
  }
  return `provider returned ${res.status}`;
}

export const emailReady = () =>
  Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
export const smsReady = () =>
  Boolean(
    process.env.SMS_ACCOUNT_SID &&
      process.env.SMS_AUTH_TOKEN &&
      process.env.SMS_FROM,
  );
export const pushReady = () =>
  Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<Outcome> {
  if (!emailReady()) return { to, ok: false, error: "not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) return { to, ok: false, error: await providerError(res) };
    return { to, ok: true };
  } catch {
    return { to, ok: false, error: "network error" };
  }
}

export async function sendSms(to: string, body: string): Promise<Outcome> {
  if (!smsReady()) return { to, ok: false, error: "not configured" };
  const sid = process.env.SMS_ACCOUNT_SID!;
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + btoa(`${sid}:${process.env.SMS_AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.SMS_FROM!,
          Body: body,
        }),
      },
    );
    if (!res.ok) return { to, ok: false, error: await providerError(res) };
    return { to, ok: true };
  } catch {
    return { to, ok: false, error: "network error" };
  }
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/** Returns how many were delivered and which endpoints are dead. */
export async function sendPush(
  targets: PushTarget[],
  message: { title: string; body: string; url: string },
) {
  if (!pushReady()) return { sent: 0, gone: [] as string[] };
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:newsletter@example.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const payload = JSON.stringify(message);
  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    targets.map(async (t) => {
      try {
        await webpush.sendNotification(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
          payload,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) gone.push(t.endpoint);
      }
    }),
  );
  return { sent, gone };
}

/** The message an issue becomes on each channel. */
export const issueAsEmail = (issue: Issue, brand: string, origin?: string) =>
  renderEmail(issue, brand, origin);
export const issueAsSms = (issue: Issue, brand: string, origin?: string) =>
  renderSms(issue, brand, origin);
export const issueAsPush = (issue: Issue, origin?: string) => ({
  title: issue.title,
  body:
    issue.blocks.find((b) => b.type === "Introduction")?.text.slice(0, 120) ??
    "Tap to read the new issue.",
  url: readUrl(issue, origin),
});
