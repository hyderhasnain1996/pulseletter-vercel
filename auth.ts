import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, hasDatabase } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";

/* Sign-in.

   Email links work with the same Resend key that sends newsletters, so no
   extra account is needed. Google is added only when its credentials exist,
   which keeps the app bootable before anyone has set it up. */
const providers = [];

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
  session: { strategy: hasDatabase() ? "database" : "jwt" },
  trustHost: true,
}));

/** True when at least one sign-in method is actually usable. */
export const authConfigured = () =>
  hasDatabase() && providers.length > 0;
