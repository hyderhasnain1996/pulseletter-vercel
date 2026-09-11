import { signIn, auth, authConfigured } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;
  const ready = authConfigured();
  const google = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className="login">
      <div className="login-art">
        <div className="brand">PulseLetter</div>
        <span className="eyebrow">YOUR IDEAS. THEIR NEXT READ.</span>
        <h1>
          Good stories
          <br />
          deserve to
          <br />
          <em>travel.</em>
        </h1>
        <p>Your newsletter studio, all in one place.</p>
      </div>
      <div className="login-form">
        <h1>Welcome.</h1>
        <p>Sign in to open your workspace.</p>

        {!ready && (
          <p className="login-warn">
            Sign-in is not configured yet. Set DATABASE_URL and AUTH_RESEND_KEY
            (and optionally AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET), then reload.
          </p>
        )}
        {error && (
          <p className="login-warn">
            That sign-in attempt did not complete. Please try again.
          </p>
        )}

        {google && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button className="primary" type="submit">
              Continue with Google
            </button>
          </form>
        )}

        {ready && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: String(formData.get("email")),
                redirectTo: "/",
              });
            }}
          >
            <label>
              Email
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
              />
            </label>
            <button className="primary" type="submit">
              Email me a sign-in link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
