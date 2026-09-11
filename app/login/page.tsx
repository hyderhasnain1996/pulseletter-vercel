import { auth, emailSignInReady, googleSignInReady, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { LandingShell } from "./landing-shell";
import { HeroContent } from "./hero-content";
import { SignInCard } from "./sign-in-card";
import "./landing.css";

export const metadata = {
  title: "Sign in — PulseLetter",
  description:
    "Turn a theme into a polished newsletter, then share it with your audience.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  await searchParams; // the card reports its own errors in place

  const google = googleSignInReady();
  const emailLink = emailSignInReady();

  /* Only offered when the provider is actually configured, so the card never
     shows a control that cannot work. */
  const alternatives =
    google || emailLink ? (
      <div className="lp-alt">
        <div className="lp-alt-sep">
          <span>OR</span>
        </div>

        {google && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button type="submit">Continue with Google</button>
          </form>
        )}

        {emailLink && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: String(formData.get("email")),
                redirectTo: "/",
              });
            }}
          >
            <label htmlFor="lp-email">Email</label>
            <input
              id="lp-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
            <button type="submit">Email me a sign-in link</button>
          </form>
        )}
      </div>
    ) : null;

  const configWarning =
    !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET
      ? "Sign-in is not configured on the server. Set AUTH_SECRET, then redeploy."
      : undefined;

  return (
    <LandingShell
      showcase={<HeroContent />}
      auth={
        <SignInCard alternatives={alternatives} configWarning={configWarning} />
      }
    />
  );
}
