import { auth, emailSignInReady, googleSignInReady, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { PasswordForm } from "./password-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;
  const missingSecret = !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET;

  const points = [
    {
      title: "Write it with AI",
      body: "Describe the theme. ChatGPT or Claude drafts the whole issue, photos included.",
    },
    {
      title: "Edit on the page",
      body: "Click any line and type. Drag blocks, drop in images, paste a video link.",
    },
    {
      title: "Send in seconds",
      body: "Email your readers, or send a free alert straight to their phone.",
    },
  ];

  return (
    <div className="auth">
      {/* Left: what this is, and why it is worth signing in to. */}
      <aside className="auth-brand">
        <div className="auth-glow" aria-hidden="true" />
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <span className="auth-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path
                  d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            PulseLetter
          </div>

          <h1 className="auth-headline">
            Your newsletter,
            <br />
            written and sent
            <br />
            <em>in one sitting.</em>
          </h1>

          <p className="auth-sub">
            A studio for people who would rather write than wrestle with tools.
          </p>

          <ul className="auth-points">
            {points.map((p, i) => (
              <li key={p.title} style={{ animationDelay: `${0.45 + i * 0.12}s` }}>
                <span className="auth-dot" aria-hidden="true" />
                <span>
                  <strong>{p.title}</strong>
                  {p.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: the sign-in itself, kept short. */}
      <main className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back.</h2>
          <p className="auth-card-sub">Sign in to open your workspace.</p>

          {missingSecret && (
            <p className="login-warn">
              <strong>Sign-in is not configured on the server.</strong>
              <br />
              Set the AUTH_SECRET environment variable, then redeploy.
            </p>
          )}

          {error && (
            <p className="login-warn">
              Those details were not recognised. Please try again.
            </p>
          )}

          <PasswordForm />

          {(emailSignInReady() || googleSignInReady()) && (
            <div className="login-divider">
              <span>or</span>
            </div>
          )}

          {googleSignInReady() && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button type="submit">Continue with Google</button>
            </form>
          )}

          {emailSignInReady() && (
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
              <button type="submit">Email me a sign-in link</button>
            </form>
          )}

          <p className="auth-foot">
            A little pulse goes a long way.
          </p>
        </div>
      </main>
    </div>
  );
}
