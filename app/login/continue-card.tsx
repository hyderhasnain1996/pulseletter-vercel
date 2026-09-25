"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "../i18n";

/* Shown in place of the sign-in form when someone is already signed in.

   The landing page is what the address opens either way; this is the door
   through to the studio rather than an automatic push into it. */
export function ContinueCard({ name }: { name: string }) {
  const { t } = useT();
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

      <h1>Welcome back{name ? `, ${name}` : ""}</h1>
      <p className="lp-card-sub">
        You are signed in. Your drafts, contacts and schedules are waiting.
      </p>

      <Link className="lp-submit" href="/dashboard">
        Open the studio
        <ArrowRight className="lp-arrow" size={17} aria-hidden="true" />
      </Link>

      <div className="lp-alt">
        <div className="lp-alt-sep">
          <span>OR</span>
        </div>
        <form action="/api/auth/signout" method="get">
          <button type="submit">{t("lp.signOut")}</button>
        </form>
      </div>

      <p className="lp-cardfoot">{t("lp.foot")}</p>
    </div>
  );
}
