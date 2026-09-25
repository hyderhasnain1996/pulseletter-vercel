import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, hasDatabase } from "./db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  appCredentials,
} from "./db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./app/lib/password";

/* Sign-in.

   Two kinds of account answer the same form. An address and password belong
   to somebody who signed up here, and that person gets a workspace of their
   own. The built-in pair -- APP_USERNAME and APP_PASSWORD, defaulting to the
   demo login -- is the shared workspace everyone lands in before anybody has
   made an account, and it stays so the app is usable with no database.

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
    async authorize(raw) {
      const username = String(raw?.username ?? "").trim();
      const password = String(raw?.password ?? "");
      if (!username || !password) return null;

      /* An account made here is looked up by address. Its own id becomes the
         session id, which is what the workspace is filed under, so one
         person's issues and contacts are never another's. */
      if (username.includes("@") && hasDatabase()) {
        const db = getDb();
        const [found] = await db
          .select({
            userId: appCredentials.userId,
            passwordHash: appCredentials.passwordHash,
            name: users.name,
            email: users.email,
          })
          .from(appCredentials)
          .innerJoin(users, eq(users.id, appCredentials.userId))
          .where(eq(appCredentials.email, username.toLowerCase()))
          .limit(1);
        if (found && (await verifyPassword(password, found.passwordHash)))
          return {
            id: found.userId,
            name: found.name ?? found.email,
            email: found.email,
          };
        return null;
      }

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
/** Signing up needs somewhere to keep the account. */
export const signUpReady = () => hasDatabase();
