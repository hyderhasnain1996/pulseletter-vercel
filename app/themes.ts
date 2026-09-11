/* Newsletter looks.

   One palette per theme, used in three places: the editor canvas, the full
   reading page, and the sent email. Keeping them here means a colour is
   defined once — the canvas applies them as CSS variables, the email inlines
   them, because email clients ignore stylesheets. */

export type Theme = {
  id: string;
  name: string;
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  rule: string;
  head: string;
  /* Shown as the little colour dot in the theme picker. */
  swatch: string;
};

export const themes: Theme[] = [
  {
    id: "classic",
    name: "Classic",
    bg: "#f7f6f1",
    ink: "#223139",
    muted: "#536568",
    accent: "#244944",
    onAccent: "#ffffff",
    rule: "#ccd3d2",
    head: "Georgia, 'Times New Roman', serif",
    swatch: "#244944",
  },
  {
    id: "editorial",
    name: "Editorial",
    bg: "#ffffff",
    ink: "#101828",
    muted: "#475467",
    accent: "#c8102e",
    onAccent: "#ffffff",
    rule: "#e4e7ec",
    head: "Georgia, 'Times New Roman', serif",
    swatch: "#c8102e",
  },
  {
    id: "sunrise",
    name: "Sunrise",
    bg: "#fff6ec",
    ink: "#3d2412",
    muted: "#8a5a33",
    accent: "#e2670a",
    onAccent: "#ffffff",
    rule: "#f2d7bb",
    head: "'Trebuchet MS', 'Segoe UI', sans-serif",
    swatch: "#e2670a",
  },
  {
    id: "meadow",
    name: "Meadow",
    bg: "#f1f8f2",
    ink: "#12291b",
    muted: "#4c6b55",
    accent: "#1f7a45",
    onAccent: "#ffffff",
    rule: "#cde3d4",
    head: "'Trebuchet MS', 'Segoe UI', sans-serif",
    swatch: "#1f7a45",
  },
  {
    id: "berry",
    name: "Berry",
    bg: "#fdf2f6",
    ink: "#2e1123",
    muted: "#7d4a67",
    accent: "#a3195b",
    onAccent: "#ffffff",
    rule: "#f3d3e1",
    head: "Georgia, 'Times New Roman', serif",
    swatch: "#a3195b",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#151b2b",
    ink: "#eef2fb",
    muted: "#a3b0cc",
    accent: "#4db2bd",
    onAccent: "#06202a",
    rule: "#2a3348",
    head: "'Trebuchet MS', 'Segoe UI', sans-serif",
    swatch: "#4db2bd",
  },
];

export const themeById = (id?: string) =>
  themes.find((t) => t.id === id) ?? themes[0];

/** The palette as CSS variables, for the canvas and the reading page. */
export const themeVars = (id?: string) => {
  const t = themeById(id);
  return {
    "--doc-bg": t.bg,
    "--doc-ink": t.ink,
    "--doc-muted": t.muted,
    "--doc-accent": t.accent,
    "--doc-on-accent": t.onAccent,
    "--doc-rule": t.rule,
    "--doc-head": t.head,
  } as React.CSSProperties;
};
