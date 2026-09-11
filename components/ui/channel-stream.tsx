"use client";

import type { ReactNode } from "react";

/* The channel corridor.

   Two perspective rails run out from a vanishing point behind the newsletter.
   Each card starts far away and small, grows as it travels toward the viewer,
   and drifts outward to the edge before fading. Cards are spaced by negative
   animation delays so the corridor is already full on the first frame.

   Everything here is decorative: the cards carry aria-hidden and the real
   controls live in the channel chips beside it. */

export type Capability = "available" | "setup" | "concept";

export type Channel = {
  id: string;
  name: string;
  tint: string;
  accent: string;
  capability: Capability;
  /** What selecting the channel demonstrates. */
  detail: string;
  /** The line shown inside the little card in the stream. */
  snippet: string;
  logo: ReactNode;
};

/* Brand marks drawn inline so the page loads no external assets. Each keeps
   its own colours; the two channels with no brand use a plain envelope and a
   message bubble rather than borrowing someone else's logo. */

const Envelope = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <rect x="2" y="4.5" width="20" height="15" rx="3" fill="#6554d9" />
    <path
      d="M3.5 7.2 12 13l8.5-5.8"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Bubble = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M12 3.5c5 0 9 3.2 9 7.2s-4 7.2-9 7.2c-.9 0-1.8-.1-2.6-.3L5 20l1.1-3.2C4.2 15.5 3 13.5 3 11.2 3 6.7 7 3.5 12 3.5Z"
      fill="#16a394"
    />
    <g fill="#fff">
      <circle cx="8.6" cy="11" r="1.1" />
      <circle cx="12" cy="11" r="1.1" />
      <circle cx="15.4" cy="11" r="1.1" />
    </g>
  </svg>
);

const Bell = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M12 3a6 6 0 0 0-6 6c0 3.6-1.1 4.8-1.8 5.6-.4.4-.1 1.2.5 1.2h14.6c.6 0 .9-.8.5-1.2-.7-.8-1.8-2-1.8-5.6a6 6 0 0 0-6-6Z"
      fill="#2f7df6"
    />
    <path d="M10.2 18.4a2 2 0 0 0 3.6 0Z" fill="#2f7df6" />
  </svg>
);

const WhatsApp = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.4 21.6l4.95-1.3A9.7 9.7 0 1 0 12 2.2Z"
      fill="#25d366"
    />
    <path
      d="M9.1 7.3c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.6.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3s-1.3-.6-1.5-.7c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.4l.4-.5c.1-.2.2-.3.2-.5v-.4s-.8-1.9-1.1-2.1Z"
      fill="#fff"
    />
  </svg>
);

const Telegram = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#229ed9" />
    <path
      d="M6.4 11.9 16 8.1c.5-.2.9.1.8.7l-1.6 7.6c-.1.5-.4.6-.9.4l-2.4-1.8-1.2 1.1c-.2.2-.3.2-.5.1l.2-2.5 4.5-4.1c.2-.2 0-.3-.3-.1l-5.6 3.5-2.4-.7c-.5-.2-.5-.5.1-.7Z"
      fill="#fff"
    />
  </svg>
);

const LinkedIn = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <rect width="24" height="24" rx="4" fill="#0a66c2" />
    <path
      d="M7.6 9.5v8H5V9.5h2.6Zm.2-2.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19 17.5h-2.6v-4.3c0-1.1-.4-1.8-1.3-1.8-.7 0-1.2.5-1.4 1-.1.2-.1.5-.1.7v4.4H11s0-7.2 0-8h2.6v1.2c.3-.6 1-1.4 2.5-1.4 1.8 0 3 1.2 3 3.8v4.4Z"
      fill="#fff"
    />
  </svg>
);

const Instagram = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <defs>
      <linearGradient id="cs-ig" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#f58529" />
        <stop offset="0.5" stopColor="#dd2a7b" />
        <stop offset="1" stopColor="#8134af" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#cs-ig)" />
    <rect
      x="6"
      y="6"
      width="12"
      height="12"
      rx="4"
      fill="none"
      stroke="#fff"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" strokeWidth="1.6" />
    <circle cx="16.1" cy="7.9" r="1" fill="#fff" />
  </svg>
);

const Facebook = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#1877f2" />
    <path
      d="M14.6 12.6h1.7l.3-2.3h-2v-1.5c0-.7.2-1.1 1.2-1.1h1V5.6c-.2 0-.8-.1-1.6-.1-1.8 0-3 1.1-3 3v1.8H10.2v2.3h1.9v5.8h2.5v-5.8Z"
      fill="#fff"
    />
  </svg>
);

export const CHANNELS: Channel[] = [
  {
    id: "email",
    name: "Email",
    tint: "#f3efff",
    accent: "#6554d9",
    capability: "available",
    detail:
      "Send the issue to your contacts. A short version carries the cover, the opening and the key points, with a button through to the full issue.",
    snippet: "Your weekly update",
    logo: Envelope,
  },
  {
    id: "push",
    name: "Phone alert",
    tint: "#e8f2ff",
    accent: "#2f7df6",
    capability: "available",
    detail:
      "Send a free notification to readers who asked for one. It arrives on their lock screen and opens the full issue.",
    snippet: "New issue is out",
    logo: Bell,
  },
  {
    id: "link",
    name: "Share link",
    tint: "#e6f7f1",
    accent: "#12967f",
    capability: "available",
    detail:
      "Every issue has a public page. Copy the link and put it anywhere you already talk to people.",
    snippet: "pulseletter.app/read",
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#12967f" />
        <path
          d="M10.5 13.5a3 3 0 0 0 4.2 0l1.6-1.6a3 3 0 0 0-4.2-4.2l-.8.8M13.5 10.5a3 3 0 0 0-4.2 0l-1.6 1.6a3 3 0 0 0 4.2 4.2l.8-.8"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "sms",
    name: "SMS",
    tint: "#e6f7f1",
    accent: "#16a394",
    capability: "setup",
    detail:
      "A short text with a link to the full issue. Ready in the app, but it needs a paid messaging account before anything can be sent.",
    snippet: "New issue → read it",
    logo: Bubble,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    tint: "#e8f8ec",
    accent: "#1da851",
    capability: "concept",
    detail:
      "How a message carrying your newsletter link could look. There is no WhatsApp integration in the app yet.",
    snippet: "Sharing this week's issue",
    logo: WhatsApp,
  },
  {
    id: "telegram",
    name: "Telegram",
    tint: "#e6f4fd",
    accent: "#1c8ec2",
    capability: "concept",
    detail:
      "How a channel post introducing your newsletter could look. Not connected to the app.",
    snippet: "This week in your inbox",
    logo: Telegram,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    tint: "#e8f1fb",
    accent: "#0a66c2",
    capability: "concept",
    detail:
      "How a professional post introducing the issue could look. Not connected to the app.",
    snippet: "New issue — a short read",
    logo: LinkedIn,
  },
  {
    id: "instagram",
    name: "Instagram",
    tint: "#fdeef5",
    accent: "#b62a72",
    capability: "concept",
    detail:
      "How a visual teaser for the issue could look. Not connected to the app.",
    snippet: "Out now",
    logo: Instagram,
  },
  {
    id: "facebook",
    name: "Facebook",
    tint: "#e9f0fd",
    accent: "#1568d6",
    capability: "concept",
    detail:
      "How a page post pointing at the issue could look. Not connected to the app.",
    snippet: "Read this week's issue",
    logo: Facebook,
  },
];

/* Which channels ride which rail. Kept explicit so the two sides stay
   visually balanced rather than alphabetical. */
const LEFT = ["email", "whatsapp", "linkedin", "sms", "telegram", "link"];
const RIGHT = ["push", "instagram", "telegram", "facebook", "email", "whatsapp"];

const CYCLE = 23; // seconds for one card to cross the corridor

function StreamCard({
  channel,
  highlighted,
}: {
  channel: Channel;
  highlighted: boolean;
}) {
  return (
    <div
      className="cs-card"
      data-hot={highlighted || undefined}
      style={{ background: channel.tint, borderColor: `${channel.accent}26` }}
    >
      <span className="cs-card-logo">{channel.logo}</span>
      <span className="cs-card-name" style={{ color: channel.accent }}>
        {channel.name}
      </span>
      <span className="cs-card-snippet">{channel.snippet}</span>
    </div>
  );
}

export function ChannelStream({ selected }: { selected: string }) {
  const byId = (id: string) => CHANNELS.find((c) => c.id === id)!;

  return (
    <div className="cs" aria-hidden="true">
      <div className="cs-fade" />

      {(["left", "right"] as const).map((side) => {
        const ids = side === "left" ? LEFT : RIGHT;
        return (
          <div className={`cs-rail cs-rail-${side}`} key={side}>
            {ids.map((id, i) => (
              <div
                className="cs-slot"
                key={`${side}-${id}-${i}`}
                style={{
                  // Negative delay starts each card partway along, so the
                  // corridor is full immediately instead of filling up.
                  animationDelay: `${-(i * CYCLE) / ids.length}s`,
                  animationDuration: `${CYCLE}s`,
                }}
              >
                <StreamCard
                  channel={byId(id)}
                  highlighted={selected === id}
                />
              </div>
            ))}
          </div>
        );
      })}

      {/* The newsletter the corridor runs out from. */}
      <div className="cs-origin">
        <span className="cs-ring" />
        <span className="cs-ring cs-ring-2" />
        <div className="cs-issue">
          <div className="cs-issue-top">
            <span className="cs-issue-mark" />
            PULSELETTER
          </div>
          <strong>Your weekly update</strong>
          <div className="cs-issue-cover">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none">
              <path
                d="M0 30 C18 30 22 10 38 10 C54 10 58 26 74 26 C90 26 96 8 120 6"
                fill="none"
                stroke="#6554d9"
                strokeWidth="2"
                strokeLinecap="round"
                opacity=".7"
              />
              <path
                d="M0 36 C22 36 26 20 44 20 C62 20 66 32 84 32 C102 32 106 16 120 14"
                fill="none"
                stroke="#41b8d8"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity=".55"
              />
            </svg>
          </div>
          <span className="cs-issue-line" />
          <span className="cs-issue-line cs-issue-line-short" />
          <span className="cs-issue-btn">Read the issue</span>
        </div>
      </div>
    </div>
  );
}

/* Shown instead of the corridor when the reader asks for reduced motion:
   the same channels, composed and still. */
export function ChannelStill({ selected }: { selected: string }) {
  return (
    <div className="cs cs-still" aria-hidden="true">
      <div className="cs-grid">
        {CHANNELS.slice(0, 8).map((c) => (
          <StreamCard key={c.id} channel={c} highlighted={selected === c.id} />
        ))}
      </div>
    </div>
  );
}
