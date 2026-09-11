import { auth, emailSignInReady, googleSignInReady } from "@/auth";
import { redirect } from "next/navigation";
import { PasswordForm } from "./password-form";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;

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
        <h1>Welcome back.</h1>
        <p>Sign in to open your workspace.</p>

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
      </div>
    </div>
  );
}
