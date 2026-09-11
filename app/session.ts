import { auth } from "@/auth";

export type AppUser = {
  userId: string;
  displayName: string;
  email: string;
};

/* The signed-in user, or null. Replaces the host-provided sign-in the
   Cloudflare build relied on; here it comes from Auth.js. */
export async function getUser(): Promise<AppUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.email) return null;
  return {
    // Set by the jwt/session callbacks in auth.ts; stable per account.
    userId: (user as { id?: string }).id ?? user.email,
    displayName: user.name ?? user.email,
    email: user.email,
  };
}
