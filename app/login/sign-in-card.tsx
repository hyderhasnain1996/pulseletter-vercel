"use client";

import { useRef, useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Lock, User, TriangleAlert } from "lucide-react";

/* Username and password sign-in.

   The request itself is unchanged: signIn("password", …) with redirect off, so
   a wrong password is reported in place instead of bouncing through an error
   page and losing what was typed. What is new is the reporting around it —
   inline validation, a live error region, and a locked-out button while a
   request is in flight. */

export function SignInCard({
  alternatives,
  configWarning,
}: {
  alternatives?: ReactNode;
  configWarning?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const missingUser = touched.username && !username.trim();
  const missingPass = touched.password && !password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busyRef.current) return; // guard against a double submit
    setTouched({ username: true, password: true });
    if (!username.trim() || !password) {
      setError("");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await signIn("password", {
        username,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("That username and password did not match. Please try again.");
      } else {
        window.location.href = "/";
        return; // keep the button busy while the browser navigates
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    busyRef.current = false;
    setBusy(false);
  }

  return (
    <div className="lp-card lp-rise lp-d4">
      <span className="lp-card-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <h1>Welcome back</h1>
      <p className="lp-card-sub">Sign in to your PulseLetter workspace.</p>

      {configWarning && (
        <div className="lp-alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{configWarning}</span>
        </div>
      )}

      {/* Announced when it appears, without stealing focus. */}
      <div role="alert" aria-live="assertive">
        {error && (
          <div className="lp-alert">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={submit} noValidate>
        <div className="lp-field">
          <label htmlFor="lp-username">Username</label>
          <div className="lp-input-wrap">
            <User size={16} aria-hidden="true" />
            <input
              id="lp-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, username: true }))}
              aria-invalid={missingUser || undefined}
              aria-describedby={missingUser ? "lp-username-hint" : undefined}
              placeholder="Your username"
            />
          </div>
          {missingUser && (
            <p className="lp-hint" id="lp-username-hint">
              Enter your username.
            </p>
          )}
        </div>

        <div className="lp-field">
          <label htmlFor="lp-password">Password</label>
          <div className="lp-input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="lp-password"
              name="password"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={missingPass || undefined}
              aria-describedby={missingPass ? "lp-password-hint" : undefined}
              placeholder="Your password"
              style={{ paddingRight: 52 }}
            />
            <button
              type="button"
              className="lp-peek"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              aria-pressed={reveal}
            >
              {reveal ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
          {missingPass && (
            <p className="lp-hint" id="lp-password-hint">
              Enter your password.
            </p>
          )}
        </div>

        <button className="lp-submit" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="lp-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="lp-arrow" size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {alternatives}

      <p className="lp-cardfoot">A little pulse goes a long way.</p>
    </div>
  );
}
