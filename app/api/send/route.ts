import { getUser } from "../../session";
import { z } from "zod";

/* Direct send.

   Delivery needs a real provider. The credentials below are read from the
   worker environment; when they are absent this route refuses with 503 and
   says exactly what is missing, rather than pretending a message went out. */

const recipients = z.array(z.string().min(3).max(320)).min(1).max(200);

const payload = z.object({
  channel: z.enum(["Email", "SMS"]),
  to: recipients,
  subject: z.string().min(1).max(200),
  html: z.string().max(400000).optional(),
  text: z.string().max(2000).optional(),
});

type Outcome = { to: string; ok: boolean; error?: string };

/* Providers explain their refusals in the response body — an unverified
   number, a blocked country, a sender that is not yours. Passing that text
   through turns "provider 400" into something actionable. */
async function providerError(res: Response) {
  try {
    const body = (await res.json()) as { message?: string; code?: number };
    if (body?.message)
      return body.code ? `${body.message} (code ${body.code})` : body.message;
  } catch {
    // Body was not JSON; fall back to the status.
  }
  return `provider returned ${res.status}`;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<Outcome> {
  const key = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { to, ok: false, error: "not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) return { to, ok: false, error: await providerError(res) };
    return { to, ok: true };
  } catch {
    return { to, ok: false, error: "network error" };
  }
}

async function sendSms(to: string, body: string): Promise<Outcome> {
  const sid = process.env.SMS_ACCOUNT_SID;
  const token = process.env.SMS_AUTH_TOKEN;
  const from = process.env.SMS_FROM;
  if (!sid || !token || !from)
    return { to, ok: false, error: "not configured" };
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${sid}:${token}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (!res.ok) return { to, ok: false, error: await providerError(res) };
    return { to, ok: true };
  } catch {
    return { to, ok: false, error: "network error" };
  }
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });

  let body: z.infer<typeof payload>;
  try {
    body = payload.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.channel === "Email";
  const ready = email
    ? Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM)
    : Boolean(process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN && process.env.SMS_FROM);
  if (!ready)
    return Response.json(
      {
        error: email
          ? "Email sending is not configured. Set EMAIL_API_KEY and EMAIL_FROM on the server."
          : "SMS sending is not configured. Set SMS_ACCOUNT_SID, SMS_AUTH_TOKEN and SMS_FROM on the server.",
        configured: false,
      },
      { status: 503 },
    );

  const unique = [...new Set(body.to)];
  const results: Outcome[] = [];
  for (const to of unique)
    results.push(
      email
        ? await sendEmail(to, body.subject, body.html ?? "")
        : await sendSms(to, body.text ?? body.subject),
    );

  const sent = results.filter((r) => r.ok).length;
  return Response.json({
    configured: true,
    sent,
    failed: results.length - sent,
    results,
  });
}
