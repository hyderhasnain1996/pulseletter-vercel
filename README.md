# Machine Learning Lab Newsletters

A newsletter studio: write an issue with AI or by hand, edit it directly on the
page, and send it to your readers.

- **Write with AI** — describe a theme, and ChatGPT or Claude drafts the whole
  issue, photos included. Paste the reply back and it becomes editable blocks.
- **Edit on the page** — click any text and type. Drag, duplicate or delete
  blocks; drop in images; paste a YouTube or Vimeo link.
- **Six themes** — Classic, Editorial, Sunrise, Meadow, Berry, Midnight.
- **Short email, full issue online** — subscribers get one photo and the key
  points with a button through to the complete newsletter.
- **Send directly** — add addresses or phone numbers and send.

## Deploying on Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repository.
3. Create a database: **Storage → Create Database → Postgres**. Vercel adds
   `DATABASE_URL` to the project automatically. (A free
   [Neon](https://neon.tech) database works too — paste its URL instead.)
4. Add the environment variables from [`.env.example`](.env.example) under
   **Settings → Environment Variables**:

   | Variable | Needed for | Where it comes from |
   | --- | --- | --- |
   | `DATABASE_URL` | Saving your work | Vercel Postgres or Neon |
   | `AUTH_SECRET` | Signing you in | `npx auth secret` |
   | `AUTH_RESEND_KEY` | Email sign-in links | [resend.com](https://resend.com) |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Sending newsletters to anyone | your own mailbox — see below |
   | `EMAIL_API_KEY` / `EMAIL_FROM` | Sending newsletters via Resend | the same Resend key |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in (optional) | Google Cloud Console |

5. Deploy, then create the database tables once:

   ```bash
   npm run db:push
   ```

   Run it locally with `DATABASE_URL` set to the same database.

### Signing in

Email sign-in works as soon as `AUTH_RESEND_KEY` is set — you get a link by
email, no password. Google sign-in appears only when `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET` are set; its redirect URI must be
`https://YOUR-APP.vercel.app/api/auth/callback/google`.

### Sending

There are two ways to send, and SMTP is used when both are configured.

**SMTP — your own mailbox.** The way to reach any address without owning a
domain. For Gmail, turn on 2-step verification, create an [App
Password](https://myaccount.google.com/apppasswords), and set:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=the-16-character-app-password
```

The App Password is not your Google password, and Gmail allows roughly 500
recipients a day. `EMAIL_FROM` is optional here — it defaults to `SMTP_USER`.

**Resend — an email API.** Better deliverability at volume, but `EMAIL_FROM`
must use a domain verified in Resend. Until a domain is verified, Resend
**only delivers to the email address that owns the Resend account** — no
matter what domain the recipient is at. That is a Resend restriction, not a
limit of this app.

### Texting an issue

A newsletter can also go out as an SMS — the headline, the key points and a
link through to the full issue. There are two ways to send one, and httpSMS is
used when both are configured.

**httpSMS — your own phone.** The same idea as SMTP, for text messages:
[httpSMS](https://httpsms.com) relays through an Android phone you already
own, so texts arrive from your own number and cost whatever your plan charges.
There is no number to rent, and no trial-account restriction on who you can
reach.

1. Install the httpSMS app from Google Play on the phone that will send.
2. Sign in and let it register the phone's number.
3. Copy the API key from [httpsms.com/settings](https://httpsms.com/settings).

```
HTTPSMS_API_KEY=the-key-from-that-settings-page
HTTPSMS_FROM=+15551234567
```

`HTTPSMS_FROM` is the sending phone's own number, in `+country` format. The
phone has to be switched on and online to pass a message along; anything it
could not hand over is listed in the httpSMS dashboard.

**Twilio — a messaging API.** Bills per message and needs a rented number. A
trial account can only text numbers you have verified in the console.

## Automations

An automation sends a newsletter on its own: pick the issue, the channel
(email or phone alert), who receives it and how often. Vercel calls
`/api/cron/run` once a day at 09:00 UTC and it sends whatever is due, then
records when each automation last ran and what happened.

Two settings are needed:

| Variable | Why |
| --- | --- |
| `CRON_SECRET` | Any long random string. The route refuses to run without it, so nobody can trigger sends by visiting the URL. |
| `SITE_ORIGIN` | The address used for links in scheduled sends, e.g. `https://your-app.vercel.app`. |

Scheduled sends use the same delivery as the Send panel, so whatever works
there works here — email needs a verified sender, phone alerts need the VAPID
keys.

Note that Vercel's Hobby plan runs cron jobs once a day. Daily, weekly and
monthly automations all work on that, because the route decides what is due
rather than relying on the schedule itself.

## Sending texts

Texts carry a short line and a link to the full issue, because a newsletter
does not fit in a message. The send panel shows the exact text and how many
messages it will be charged as, so it can be kept to one.

Texts need a Twilio account, a bought phone number and three variables:
`SMS_ACCOUNT_SID`, `SMS_AUTH_TOKEN` and `SMS_FROM`. There is no free tier for
real delivery — a number is roughly $1-2 a month plus a few cents per message,
and trial accounts can only text numbers you have verified.

Email needs none of that, so it stays the cheaper way to reach most readers.

### Message length

One segment is 140 bytes: 160 characters of plain Latin text, but only 70 if
the message contains any non-Latin character — Korean, Japanese, Arabic or an
emoji. The wording is trimmed to fit a single segment, dropping the intro and
then shortening the title as needed, because some networks do not rejoin split
messages and they arrive as separate fragments.

### South Korea (+82)

Twilio can reach Korean numbers with an international long code, but domestic
long codes, short codes and alphanumeric sender IDs are not supported, the
sender is automatically prefixed with 009 or 006, two-way replies do not work,
and split messages are not rejoined. With a Korean title the whole message has
to fit 70 characters including the link, so it will usually be the title alone.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:push
npm run dev
```

## Notes

This app was originally built for Cloudflare Workers with a D1 database and
platform-provided sign-in. This version replaces those with Postgres and
[Auth.js](https://authjs.dev) so it runs on Vercel.
