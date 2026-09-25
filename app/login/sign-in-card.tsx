"use client";

import { useRef, useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useT } from "../i18n";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  TriangleAlert,
} from "lucide-react";

/* Username and password sign-in.

   The request itself is unchanged: signIn("password", …) with redirect off, so
   a wrong password is reported in place instead of bouncing through an error
   page and losing what was typed. What is new is the reporting around it —
   inline validation, a live error region, and a locked-out button while a
   request is in flight. */

export function SignInCard({
  alternatives,
  notConfigured,
  canSignUp = false,
}: {
  alternatives?: ReactNode;
  notConfigured?: boolean;
  /* Making an account needs somewhere to keep it, so the offer only appears
     when the server actually has a database. */
  canSignUp?: boolean;
}) {
  const { t } = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const signup = mode === "up";
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    password: false,
  });
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const missingName = signup && touched.name && !name.trim();
  const missingUser = touched.username && !username.trim();
  const badEmail =
    signup && touched.username && !!username.trim() && !/^\S+@\S+\.\S{2,}$/.test(username.trim());
  const shortPass = signup && touched.password && !!password && password.length < 8;
  const missingPass = touched.password && !password;

  /* Signing in and signing up post to different places, but end the same
     way: signed in, on the dashboard. Making an account therefore signs in
     with the details just entered rather than asking for them twice. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busyRef.current) return; // guard against a double submit
    setTouched({ name: true, username: true, password: true });
    if (!username.trim() || !password || (signup && !name.trim())) {
      setError("");
      return;
    }
    if (signup && (badEmail || password.length < 8)) {
      setError("");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (signup) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: username.trim(),
            password,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(
            body.error === "taken"
              ? t("su.taken")
              : body.error === "no-database"
                ? t("su.needDatabase")
                : t("su.failed"),
          );
          busyRef.current = false;
          setBusy(false);
          return;
        }
      }

      const res = await signIn("password", {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(signup ? t("su.failed") : t("lp.noMatch"));
      } else {
        window.location.href = "/dashboard";
        return; // keep the button busy while the browser navigates
      }
    } catch {
      setError(t("lp.unreachable"));
    }
    busyRef.current = false;
    setBusy(false);
  }

  /* Switching between the two clears what the other one complained about,
     so an error from signing in does not greet somebody signing up. */
  function switchMode() {
    setMode(signup ? "in" : "up");
    setError("");
    setTouched({ name: false, username: false, password: false });
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

      <h1>{signup ? t("su.title") : t("lp.welcome")}</h1>
      <p className="lp-card-sub">
        {signup ? t("su.sub") : t("lp.signInTo")}
      </p>

      {notConfigured && (
        <div className="lp-alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{t("lp.notConfigured")}</span>
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
        {signup && (
          <div className="lp-field">
            <label htmlFor="lp-name">{t("su.name")}</label>
            <div className="lp-input-wrap">
              <User size={16} aria-hidden="true" />
              <input
                id="lp-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((x) => ({ ...x, name: true }))}
                aria-invalid={missingName || undefined}
                aria-describedby={missingName ? "lp-name-hint" : undefined}
                placeholder={t("su.nameHint")}
              />
            </div>
            {missingName && (
              <p className="lp-hint" id="lp-name-hint">
                {t("su.enterName")}
              </p>
            )}
          </div>
        )}

        <div className="lp-field">
          <label htmlFor="lp-username">
            {signup ? t("su.email") : t("su.signInEmail")}
          </label>
          <div className="lp-input-wrap">
            {signup ? (
              <Mail size={16} aria-hidden="true" />
            ) : (
              <User size={16} aria-hidden="true" />
            )}
            <input
              id="lp-username"
              name="username"
              type={signup ? "email" : "text"}
              autoComplete={signup ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((x) => ({ ...x, username: true }))}
              aria-invalid={missingUser || badEmail || undefined}
              aria-describedby={
                missingUser || badEmail ? "lp-username-hint" : undefined
              }
              placeholder={
                signup ? t("su.emailHint") : t("su.signInEmailHint")
              }
            />
          </div>
          {(missingUser || badEmail) && (
            <p className="lp-hint" id="lp-username-hint">
              {missingUser
                ? signup
                  ? t("su.enterEmail")
                  : t("lp.enterUsername")
                : t("su.badEmail")}
            </p>
          )}
        </div>

        <div className="lp-field">
          <label htmlFor="lp-password">
            {signup ? t("su.password") : t("lp.password")}
          </label>
          <div className="lp-input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="lp-password"
              name="password"
              type={reveal ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((x) => ({ ...x, password: true }))}
              aria-invalid={missingPass || shortPass || undefined}
              aria-describedby={
                missingPass || shortPass ? "lp-password-hint" : undefined
              }
              placeholder={
                signup ? t("su.passwordHint") : t("lp.passwordHint")
              }
              style={{ paddingRight: 52 }}
            />
            <button
              type="button"
              className="lp-peek"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? t("lp.hidePassword") : t("lp.showPassword")}
              aria-pressed={reveal}
            >
              {reveal ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
          {(missingPass || shortPass) && (
            <p className="lp-hint" id="lp-password-hint">
              {missingPass ? t("lp.enterPassword") : t("su.shortPassword")}
            </p>
          )}
        </div>

        <button className="lp-submit" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="lp-spin" aria-hidden="true" />
              {signup ? t("su.creating") : t("lp.signingIn")}
            </>
          ) : (
            <>
              {signup ? t("su.create") : t("lp.signIn")}
              <ArrowRight className="lp-arrow" size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {canSignUp && (
        <p className="lp-switch">
          {signup ? t("su.haveAccount") : t("su.newHere")}{" "}
          <button type="button" onClick={switchMode}>
            {signup ? t("su.goSignIn") : t("su.create")}
          </button>
        </p>
      )}

      {alternatives}

      <p className="lp-cardfoot">{t("lp.foot")}</p>
    </div>
  );
}
