/* Configuration check.

   Reports which settings the running server can see, so a deployment can be
   diagnosed without reading the dashboard. It returns only whether each name
   is present — never the values themselves. */

export const dynamic = "force-dynamic";

const present = (name: string) => Boolean(process.env[name]);

export function GET() {
  return Response.json(
    {
      runtime: {
        vercel: Boolean(process.env.VERCEL),
        environment: process.env.VERCEL_ENV ?? "unknown",
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
      },
      signIn: {
        AUTH_SECRET: present("AUTH_SECRET"),
        NEXTAUTH_SECRET: present("NEXTAUTH_SECRET"),
        APP_USERNAME: present("APP_USERNAME"),
        APP_PASSWORD: present("APP_PASSWORD"),
      },
      database: {
        DATABASE_URL: present("DATABASE_URL"),
        POSTGRES_URL: present("POSTGRES_URL"),
        POSTGRES_URL_NON_POOLING: present("POSTGRES_URL_NON_POOLING"),
      },
      sending: {
        EMAIL_API_KEY: present("EMAIL_API_KEY"),
        EMAIL_FROM: present("EMAIL_FROM"),
        SMTP_HOST: present("SMTP_HOST"),
        SMTP_USER: present("SMTP_USER"),
        SMTP_PASS: present("SMTP_PASS"),
      },
      /* Every variable name the server can see, so a misspelling or a
         variable attached to the wrong environment shows up plainly. */
      namesVisible: Object.keys(process.env)
        .filter((k) => !/^(npm_|NODE_|PATH|HOME|PWD|_)/.test(k))
        .sort(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
