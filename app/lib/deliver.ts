import webpush from "web-push";
import nodemailer from "nodemailer";
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

/* Two ways to send email.

   SMTP is the one that reaches any address: signed in to a mailbox you own
   (a Gmail App Password, for instance), a message goes wherever you address
   it. Resend without a verified domain only delivers to the account owner,
   so where both are configured SMTP wins. */
export const smtpReady = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      emailFrom(),
  );
const resendReady = () =>
  Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
export const emailReady = () => smtpReady() || resendReady();

/** The From address. With SMTP it defaults to the mailbox being signed into,
    so EMAIL_FROM is optional there. */
function emailFrom() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "";
}

/* One connection, reused. Built on first use so importing this module never
   opens a socket. */
let mailer: nodemailer.Transporter | undefined;
function transport() {
  if (!mailer) {
    const port = Number(process.env.SMTP_PORT || 465);
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 587 starts plain and upgrades with STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return mailer;
}

/* Pictures are stored inline as data: URLs, and mail clients refuse to load
   those — Gmail and Outlook both drop a <img src="data:..."> silently, so the
   message arrives with a hole where the photo should be. Over SMTP we can do
   better: lift each one out into a real attachment and point the tag at it by
   content id, which every client renders. Identical images are attached once. */
function inlineImages(html: string) {
  const attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
    cid: string;
    contentDisposition: "inline";
  }[] = [];
  const seen = new Map<string, string>();

  const body = html.replace(
    /src="(data:image\/([a-zA-Z0-9.+-]+);base64,([^"]+))"/g,
    (_all, url: string, subtype: string, base64: string) => {
      let cid = seen.get(url);
      if (!cid) {
        cid = `img${seen.size + 1}@pulseletter`;
        seen.set(url, cid);
        attachments.push({
          filename: `image-${attachments.length + 1}.${subtype === "jpeg" ? "jpg" : subtype}`,
          content: Buffer.from(base64, "base64"),
          contentType: `image/${subtype}`,
          cid,
          contentDisposition: "inline",
        });
      }
      return `src="cid:${cid}"`;
    },
  );
  return { body, attachments };
}

async function sendOverSmtp(
  to: string,
  subject: string,
  html: string,
): Promise<Outcome> {
  try {
    const { body, attachments } = inlineImages(html);
    await transport().sendMail({
      from: emailFrom(),
      to,
      subject,
      html: body,
      ...(attachments.length ? { attachments } : {}),
    });
    return { to, ok: true };
  } catch (err) {
    /* The mail server explains refusals in the message — a wrong App
       Password, a daily limit, a rejected recipient — so pass it through
       instead of a generic failure. */
    const m = err instanceof Error ? err.message : "send failed";
    return { to, ok: false, error: m.split("\n")[0].slice(0, 200) };
  }
}

/* Two ways to send SMS, and httpSMS wins when both are set.

   httpSMS relays through an Android phone you already own, so a text arrives
   from your own number and costs whatever your plan charges. Twilio bills per
   message and, on a trial account, only reaches numbers you have verified —
   the same reason SMTP wins over Resend above. */
export const httpSmsReady = () =>
  Boolean(process.env.HTTPSMS_API_KEY && process.env.HTTPSMS_FROM);
const twilioReady = () =>
  Boolean(
    process.env.SMS_ACCOUNT_SID &&
      process.env.SMS_AUTH_TOKEN &&
      process.env.SMS_FROM,
  );
export const smsReady = () => httpSmsReady() || twilioReady();
export const pushReady = () =>
  Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<Outcome> {
  if (smtpReady()) return sendOverSmtp(to, subject, html);
  if (!resendReady()) return { to, ok: false, error: "not configured" };
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

/* The phone has to be online and reachable for httpSMS to hand the message
   over; a queued message that never leaves shows up in the httpSMS dashboard
   rather than as an error here. */
async function sendOverHttpSms(to: string, body: string): Promise<Outcome> {
  try {
    const res = await fetch("https://api.httpsms.com/v1/messages/send", {
      method: "POST",
      headers: {
        "x-api-key": process.env.HTTPSMS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        content: body,
        from: process.env.HTTPSMS_FROM,
        to,
      }),
    });
    if (!res.ok) return { to, ok: false, error: await providerError(res) };
    return { to, ok: true };
  } catch {
    return { to, ok: false, error: "network error" };
  }
}

async function sendOverTwilio(to: string, body: string): Promise<Outcome> {
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

export async function sendSms(to: string, body: string): Promise<Outcome> {
  if (httpSmsReady()) return sendOverHttpSms(to, body);
  if (twilioReady()) return sendOverTwilio(to, body);
  return { to, ok: false, error: "not configured" };
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
