"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CHANNELS,
  ChannelStream,
  ChannelStill,
  type Capability,
} from "@/components/ui/channel-stream";

/* The showcase: a moving corridor of channel cards, with stable controls
   underneath.

   The cards are decoration. Everything a reader can operate is a real button
   below them, and selecting one only changes what this panel describes — no
   message is sent and nothing is published from this page. */

const LABEL: Record<Capability, string> = {
  available: "Available",
  setup: "Needs a provider",
  concept: "Concept preview",
};

/* Reduced motion is read through the store so the first render already knows,
   rather than rendering the corridor and then removing it. */
const calm = {
  subscribe(listener: () => void) {
    if (typeof window === "undefined") return () => {};
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  },
  get: () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  server: () => false,
};

export function ChannelShowcase() {
  const [selected, setSelected] = useState("email");
  const reduced = useSyncExternalStore(calm.subscribe, calm.get, calm.server);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const active = CHANNELS.find((c) => c.id === selected)!;

  /* A few pixels of parallax on the corridor only. Written to a custom
     property inside one animation frame, so pointer movement never re-renders. */
  useEffect(() => {
    const el = stage.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let x = 0;
    let y = 0;
    const draw = () => {
      frame.current = 0;
      el.style.setProperty("--cs-px", `${x.toFixed(2)}px`);
      el.style.setProperty("--cs-py", `${y.toFixed(2)}px`);
    };
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      x = ((e.clientX - b.left) / b.width - 0.5) * 10; // ±5px
      y = ((e.clientY - b.top) / b.height - 0.5) * 8;
      if (!frame.current) frame.current = requestAnimationFrame(draw);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame.current) frame.current = requestAnimationFrame(draw);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [reduced]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const last = CHANNELS.length - 1;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? last
          : e.key === "ArrowRight"
            ? (index + 1) % CHANNELS.length
            : (index - 1 + CHANNELS.length) % CHANNELS.length;
    setSelected(CHANNELS[next].id);
    chips.current[next]?.focus();
  };

  return (
    <section className="lp-showcase-wrap" aria-labelledby="lp-channels-heading">
      <div className="lp-showcase-head">
        <h2 id="lp-channels-heading">Channel preview</h2>
        <p>A demonstration. Nothing is sent or published from this page.</p>
      </div>

      <div className="lp-stage lp-rise lp-d3" ref={stage}>
        {reduced ? (
          <ChannelStill selected={selected} />
        ) : (
          <ChannelStream selected={selected} />
        )}
      </div>

      <div
        className="lp-chips"
        role="tablist"
        aria-label="Channels"
      >
        {CHANNELS.map((c, i) => {
          const on = c.id === selected;
          return (
            <button
              key={c.id}
              ref={(el) => {
                chips.current[i] = el;
              }}
              id={`lp-chip-${c.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="lp-channel-detail"
              tabIndex={on ? 0 : -1}
              className="lp-chip"
              style={on ? { borderColor: `${c.accent}66`, background: c.tint } : undefined}
              onClick={() => setSelected(c.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="lp-chip-logo">{c.logo}</span>
              {c.name}
            </button>
          );
        })}
      </div>

      <div
        className="lp-detail"
        id="lp-channel-detail"
        role="tabpanel"
        aria-labelledby={`lp-chip-${active.id}`}
        tabIndex={0}
      >
        <div className="lp-detail-top">
          <span className="lp-detail-logo" style={{ background: active.tint }}>
            {active.logo}
          </span>
          <div>
            <strong>{active.name}</strong>
            <span className={`lp-tagpill lp-tag-${active.capability}`}>
              {LABEL[active.capability]}
            </span>
          </div>
        </div>
        <p>{active.detail}</p>
      </div>
    </section>
  );
}
