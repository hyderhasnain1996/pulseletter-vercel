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

const TILT_MAX = 2.5; // degrees

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
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const target = useRef({ x: 0, y: 0, tx: 0, ty: 0, active: false });
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

  /* Pointer glow and a very small tilt, fine pointers only. */
  useEffect(() => {
    const el = root.current;
    const showcaseEl = stage.current;
    if (!el || !showcaseEl) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches || !motion) {
      el.setAttribute("data-pointer", "off");
      showcaseEl.style.removeProperty("--tilt-x");
      showcaseEl.style.removeProperty("--tilt-y");
      return;
    }

    const draw = () => {
      frame.current = 0;
      const { x, y, tx, ty, active } = target.current;
      el.style.setProperty("--lp-x", `${x}px`);
      el.style.setProperty("--lp-y", `${y}px`);
      const card = showcaseEl.querySelector<HTMLElement>(".lp-preview");
      if (card) {
        card.style.setProperty("--tilt-x", active ? `${tx}deg` : "0deg");
        card.style.setProperty("--tilt-y", active ? `${ty}deg` : "0deg");
      }
    };

    const schedule = () => {
      if (!frame.current) frame.current = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      target.current.x = e.clientX - box.left;
      target.current.y = e.clientY - box.top;

      const card = showcaseEl.getBoundingClientRect();
      const withinCard =
        e.clientX >= card.left &&
        e.clientX <= card.right &&
        e.clientY >= card.top &&
        e.clientY <= card.bottom;
      target.current.active = withinCard;
      if (withinCard) {
        const px = (e.clientX - card.left) / card.width - 0.5;
        const py = (e.clientY - card.top) / card.height - 0.5;
        target.current.ty = px * TILT_MAX * 2;
        target.current.tx = -py * TILT_MAX * 2;
      }
      schedule();
    };

    const onLeave = () => {
      target.current.active = false;
      schedule();
    };

    el.setAttribute("data-pointer", "on");
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [motion]);

  return (
    <div
      ref={root}
      className="lp"
      data-motion={motion ? "on" : "off"}
      data-hidden="false"
    >
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <svg className="lp-pulse" viewBox="0 0 1400 120" preserveAspectRatio="none">
          <path
            d="M0 60 H420 l26 -44 l30 88 l24 -68 l22 46 l18 -22 H1400"
            fill="none"
            stroke="#48ced8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="lp-spot" />
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
          <div className="lp-showcase" ref={stage}>
            {showcase}
          </div>
          <div className="lp-auth">{auth}</div>
        </div>
      </div>
    </div>
  );
}
