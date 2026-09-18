/* Checks the httpSMS settings in .env.local, then sends one test text.

   Run with:  node --env-file=.env.local check-sms.mjs
   Or to a different number:
              node --env-file=.env.local check-sms.mjs +15551234567          */

const { HTTPSMS_API_KEY, HTTPSMS_FROM } = process.env;

if (!HTTPSMS_API_KEY || !HTTPSMS_FROM) {
  console.error(
    "Missing HTTPSMS_API_KEY or HTTPSMS_FROM in .env.local.\n" +
      "The key comes from https://httpsms.com/settings, and HTTPSMS_FROM is\n" +
      "the sending phone's own number in +country format.",
  );
  process.exit(1);
}

/* Both numbers go out in +country format; httpSMS rejects anything else. */
const to = process.argv[2] || HTTPSMS_FROM;
for (const [name, value] of [
  ["HTTPSMS_FROM", HTTPSMS_FROM],
  ["the recipient", to],
]) {
  if (!/^\+[1-9]\d{6,14}$/.test(value)) {
    console.error(`${name} is "${value}" — it needs the country code, e.g. +15551234567`);
    process.exit(1);
  }
}

const res = await fetch("https://api.httpsms.com/v1/messages/send", {
  method: "POST",
  headers: {
    "x-api-key": HTTPSMS_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    content: "PulseLetter test — texting works.",
    from: HTTPSMS_FROM,
    to,
  }),
});

if (!res.ok) {
  /* httpSMS explains refusals in the body — an unknown key, a number that is
     not the registered phone — so show that rather than a bare status. */
  let detail = `httpSMS returned ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) detail = body.message;
    if (body?.data) detail += ` (${JSON.stringify(body.data)})`;
  } catch {
    // Not JSON; the status is all there is.
  }
  console.error("Could not send:", detail);
  process.exit(1);
}

console.log(`Handed to httpSMS: ${HTTPSMS_FROM} -> ${to}`);
console.log(
  "Your phone sends it when it is next online. If nothing arrives, check\n" +
    "the message list at https://httpsms.com — a phone that is off or has\n" +
    "lost its connection leaves the message queued there.",
);
