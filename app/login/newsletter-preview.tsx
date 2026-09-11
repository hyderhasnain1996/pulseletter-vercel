"use client";

import { useRef, useState } from "react";
import { PenLine, SlidersHorizontal, Send } from "lucide-react";

/* A miniature, non-functional newsletter used to show the journey: write it,
   edit it, send it.

   Everything here is a local demonstration. Nothing in this file performs a
   network request, signs anyone in, or delivers a message. */

type Step = "write" | "edit" | "send";

const STEPS: { id: Step; label: string; icon: typeof PenLine; note: string }[] = [
  {
    id: "write",
    label: "Write",
    icon: PenLine,
    note: "Give it a theme and the issue takes shape — headline, opening and stories.",
  },
  {
    id: "edit",
    label: "Edit",
    icon: SlidersHorizontal,
    note: "Select any block and change it in place. Reorder, restyle, swap the cover.",
  },
  {
    id: "send",
    label: "Send",
    icon: Send,
    note: "Choose who receives it, then send by email or as an alert to their phone.",
  },
];

function Cover() {
  return (
    <div className="lp-cover" aria-hidden="true">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none">
        <path
          d="M0 96 C60 96 70 34 120 34 C170 34 176 82 226 82 C276 82 288 22 340 22 C374 22 388 44 400 52"
          fill="none"
          stroke="#7fe3ec"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M0 108 C70 108 84 60 140 60 C196 60 206 96 256 96 C306 96 318 48 400 40"
          fill="none"
          stroke="#8aabff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="120" cy="34" r="3.5" fill="#7fe3ec" />
        <circle cx="340" cy="22" r="3" fill="#8aabff" />
      </svg>
    </div>
  );
}

export function NewsletterPreview() {
  const [step, setStep] = useState<Step>("write");
  const [demo, setDemo] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Arrow, Home and End move between the selectors, as a tablist should. */
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const last = STEPS.length - 1;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? last
          : e.key === "ArrowRight"
            ? (index + 1) % STEPS.length
            : (index - 1 + STEPS.length) % STEPS.length;
    setStep(STEPS[next].id);
    setDemo("");
    tabRefs.current[next]?.focus();
  };

  const active = STEPS.find((s) => s.id === step)!;

  return (
    <section className="lp-stage-wrap" aria-labelledby="lp-demo-heading">
      <h2 id="lp-demo-heading" className="lp-sr">
        How PulseLetter works
      </h2>

      <div className="lp-tabs" role="tablist" aria-label="What the workspace does">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const selected = s.id === step;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`lp-tab-${s.id}`}
              className="lp-tab"
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="lp-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                setStep(s.id);
                setDemo("");
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <Icon size={15} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="lp-tabnote">{active.note}</p>

      <div className="lp-stage">
        <div
          className="lp-preview lp-rise lp-d3"
          id="lp-panel"
          role="tabpanel"
          aria-labelledby={`lp-tab-${step}`}
          tabIndex={0}
        >
          <div className="lp-bar">
            <span className="lp-bar-brand">
              <span className="lp-bar-dot" aria-hidden="true" />
              PULSELETTER
            </span>
            <span className="lp-chip">Sample preview</span>
          </div>

          {/* Keyed so each step animates in once, rather than on every render. */}
          <div className="lp-doc lp-panel" key={step}>
            {step === "write" && (
              <div className="lp-reveal">
                <span className="lp-theme">
                  <span className="lp-bar-dot" aria-hidden="true" />
                  This week in AI
                </span>
                <h3 className="lp-h lp-focus">A fresh perspective, delivered.</h3>
                <p className="lp-p lp-focus">
                  A short opening that sets up the issue, written from the theme
                  you gave it.
                </p>
                <Cover />
              </div>
            )}

            {step === "edit" && (
              <>
                <div className="lp-format" aria-hidden="true">
                  <span data-on="true">B</span>
                  <span>
                    <em>I</em>
                  </span>
                  <span>H2</span>
                  <span>“”</span>
                </div>
                <h3 className="lp-h">A fresh perspective, delivered.</h3>
                <Cover />
                <div className="lp-stories">
                  <div className="lp-story" data-selected="true">
                    <strong>The shift in tooling</strong>
                    <span>Selected block — change the words, style or order.</span>
                  </div>
                  <div className="lp-story">
                    <strong>What readers noticed</strong>
                    <span>A second story sits alongside it.</span>
                  </div>
                </div>
              </>
            )}

            {step === "send" && (
              <>
                <h3 className="lp-h">A fresh perspective, delivered.</h3>
                <div className="lp-deliver" style={{ marginTop: 16 }}>
                  <div className="lp-deliver-row">
                    <span>Channel</span>
                    <b>Email · Phone alert</b>
                  </div>
                  <div className="lp-deliver-row">
                    <span>Audience</span>
                    <b>Your contact groups</b>
                  </div>
                  <div className="lp-deliver-row">
                    <span>Status</span>
                    <b>Draft preview</b>
                  </div>
                  <button
                    type="button"
                    className="lp-demo"
                    onClick={() => setDemo("Demo complete — no message sent.")}
                  >
                    <Send size={14} aria-hidden="true" />
                    Preview delivery
                  </button>
                  <p className="lp-demo-note" role="status" aria-live="polite">
                    {demo || "A demonstration only. Nothing is delivered from this page."}
                  </p>
                </div>
              </>
            )}

            {step !== "send" && (
              <div className="lp-footrow">
                <span className="lp-cta">Read the full issue</span>
                <span className="lp-chip lp-chip-live">Draft preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
