"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";

/* The page frame: background layers, ambient motion and the pointer glow.

   Pointer movement is written straight to CSS custom properties inside a
   requestAnimationFrame callback, so moving the mouse never re-renders React.
   Decorative motion stops when the reader asks for less, when they pause it,
   and when the tab is hidden. */

/* The motion preference lives outside React so it can be read during render
   rather than assigned from an effect, which would cost an extra pass and
   briefly animate for someone who had already turned it off. */
const KEY = "pulse-motion";
const listeners = new Set<() => void>();

const readPreference = () => {
  try {
    return localStorage.getItem(KEY) === "off" ? "off" : "on";
  } catch {
    return "on"; // storage blocked; motion stays on
  }
};

const motionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: readPreference,
  serverGet: () => "on" as const,
  set(value: "on" | "off") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // Not fatal: the choice simply will not persist.
    }
    listeners.forEach((l) => l());
  },
};

export function LandingShell({
  showcase,
  auth,
}: {
  showcase: ReactNode;
  auth: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const motion =
    useSyncExternalStore(
      motionStore.subscribe,
      motionStore.get,
      motionStore.serverGet,
    ) === "on";

  const toggleMotion = useCallback(
    () => motionStore.set(readPreference() === "on" ? "off" : "on"),
    [],
  );

  /* Pause the decorative layers while the tab is in the background. */
  useEffect(() => {
    const onVisibility = () =>
      root.current?.setAttribute(
        "data-hidden",
        document.hidden ? "true" : "false",
      );
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      ref={root}
      className="lp"
      data-motion={motion ? "on" : "off"}
      data-hidden="false"
    >
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-dots" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>

      <div className="lp-inner">
        <header className="lp-top">
          {/* No prefetch: the dashboard is behind sign-in, so pulling its
              bundle here only wastes bandwidth and returns a 401. */}
          <Link className="lp-brand lp-rise" href="/" prefetch={false}>
            <span className="lp-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <path
                  d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            PulseLetter
          </Link>

          <button
            type="button"
            className="lp-motion lp-rise lp-d1"
            onClick={toggleMotion}
            aria-pressed={!motion}
          >
            {motion ? (
              <Pause size={14} aria-hidden="true" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            {motion ? "Pause animations" : "Play animations"}
          </button>
        </header>

        <div className="lp-columns">
          <div className="lp-showcase">{showcase}</div>
          <div className="lp-auth">{auth}</div>
        </div>

        <p className="lp-foot">
          Channel preview is a demonstration. Nothing is sent or published from
          this page.
        </p>
      </div>
    </div>
  );
}
