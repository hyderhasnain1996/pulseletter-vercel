import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, hasDatabase } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";

/* Sign-in.

   Username and password is the default way in. The pair lives in the
   environment so it can be changed without editing code; APP_USERNAME and
   APP_PASSWORD override the built-in values. Everyone who signs in this way
   shares one workspace, since there is only one account.

   Email links and Google are added only when their credentials exist, so the
   app still boots before any of that is set up. */

const APP_USER = process.env.APP_USERNAME || "mllab";
const APP_PASS = process.env.APP_PASSWORD || "mllab";

/* Compare without leaking length or position through timing. */
function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "password",
    name: "Username and password",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize(raw) {
      const username = String(raw?.username ?? "");
      const password = String(raw?.password ?? "");
      if (!sameSecret(username, APP_USER)) return null;
      if (!sameSecret(password, APP_PASS)) return null;
      // A stable id keeps this account pointed at the same workspace.
      return { id: "app-user", name: APP_USER, email: `${APP_USER}@local` };
    },
  }),
];

if (process.env.AUTH_RESEND_KEY)
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    }),
  );

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: hasDatabase()
    ? DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  providers,
  pages: { signIn: "/login" },
  /* Password sign-in requires JWT sessions; Auth.js cannot store a database
     session for a user that has no adapter record. */
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.uid)
        (session.user as { id?: string }).id = String(token.uid);
      return session;
    },
  },
  trustHost: true,
}));

/** Password sign-in always works; this reports the optional extras. */
export const emailSignInReady = () => Boolean(process.env.AUTH_RESEND_KEY);
export const googleSignInReady = () =>
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
