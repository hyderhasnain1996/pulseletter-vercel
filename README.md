# PulseLetter Studio

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
   | `EMAIL_API_KEY` | Sending newsletters | the same Resend key |
   | `EMAIL_FROM` | Sending newsletters | an address at a domain you verified |
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

`EMAIL_FROM` must use a domain verified in Resend. The test sender
`onboarding@resend.dev` needs no verification but **only delivers to the email
address that owns the Resend account** — fine for a first test, not for real
subscribers.

## Sending texts

Texts carry a short line and a link to the full issue, because a newsletter
does not fit in a message. The send panel shows the exact text and how many
messages it will be charged as, so it can be kept to one.

Texts need a Twilio account, a bought phone number and three variables:
`SMS_ACCOUNT_SID`, `SMS_AUTH_TOKEN` and `SMS_FROM`. There is no free tier for
real delivery — a number is roughly $1-2 a month plus a few cents per message,
and trial accounts can only text numbers you have verified.

Email needs none of that, so it stays the cheaper way to reach most readers.

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
