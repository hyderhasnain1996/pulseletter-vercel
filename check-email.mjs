/* Checks the SMTP settings in .env.local, then sends one test email to yourself.
   Run with:  node --env-file=.env.local check-email.mjs            */
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("Missing SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local");
  process.exit(1);
}
if (SMTP_PASS.startsWith("PASTE_YOUR")) {
  console.error("SMTP_PASS is still the placeholder — paste your App Password into .env.local first.");
  process.exit(1);
}

const port = Number(SMTP_PORT || 465);
const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  await mailer.verify();
  console.log(`Signed in to ${SMTP_HOST} as ${SMTP_USER}`);
} catch (err) {
  console.error("Could not sign in:", err.message.split("\n")[0]);
  process.exit(1);
}

const info = await mailer.sendMail({
  from: EMAIL_FROM || SMTP_USER,
  to: SMTP_USER,
  subject: "ML Lab newsletter test",
  html: "<p>If you are reading this, the newsletter studio can send from your Gmail.</p>",
});
console.log(`Test email sent to ${SMTP_USER} (id ${info.messageId})`);
console.log("Check your inbox.");
