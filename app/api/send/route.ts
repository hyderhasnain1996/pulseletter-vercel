import { getUser } from "../../session";
import {
  sendEmail,
  sendSms,
  emailReady,
  smsReady,
  type Outcome,
} from "../../lib/deliver";
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
  const ready = email ? emailReady() : smsReady();
  if (!ready)
    return Response.json(
      {
        error: email
          ? "Email sending is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS to send through your own mailbox, or EMAIL_API_KEY and EMAIL_FROM to send through Resend."
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
