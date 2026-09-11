/* Turning an assistant's draft into newsletter blocks.

   ChatGPT and Claude can't push content back into this app, so the round trip
   is: open the assistant with a prompt that asks for a labelled format, then
   paste the reply here. The parser stays forgiving — it reads the labelled
   format first and falls back to plain Markdown, because people paste both. */

import type { Block } from "./data";

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? "b" + Math.random().toString(36).slice(2);

/** The label each assistant is asked to emit, mapped to a block type. */
const labels: Record<string, string> = {
  title: "Title",
  intro: "Introduction",
  introduction: "Introduction",
  story: "Featured story",
  text: "Rich text",
  announcement: "Announcement",
  event: "Event",
  button: "Button",
  image: "Image",
  video: "Video",
  divider: "Divider",
  footer: "Footer",
  details: "Details",
  more: "Details",
};

export function buildPrompt(topic: string) {
  const subject = topic.trim() || "our latest update";
  return `Write a complete, detailed email newsletter about: ${subject}

I am only giving you the theme — you write every word. Make it genuinely
informative: specific, concrete and worth reading, not filler.

Structure it so a reader gets the main points at a glance, and the depth is
tucked behind a "Read more" fold. For each of the two or three main sections,
write a short STORY line (the takeaway, 1-2 sentences) immediately followed by
a DETAILS block (the full explanation, 2-4 short paragraphs).

Reply using ONLY these labels, one per line, no Markdown, no extra commentary:

TITLE: a short, specific headline
IMAGE: the cover photo subject
INTRO: two or three welcoming sentences setting up the issue
STORY: the first takeaway, 1-2 sentences
DETAILS: the full explanation of that first point, 2-4 paragraphs
IMAGE: a photo subject for this section
STORY: the second takeaway, 1-2 sentences
DETAILS: the full explanation of the second point, 2-4 paragraphs
ANNOUNCEMENT: one short, useful note
DIVIDER
BUTTON: the call-to-action label
FOOTER: a brief sign-off

Rules for IMAGE: name a physical, photographable thing in one or two common
words — "coffee beans", "autumn leaves", "library", "bicycle", "city skyline".
Never an abstract idea ("innovation", "growth", "technology"), never a mood,
never a sentence, never a URL. I will find the photo myself.

Separate paragraphs inside DETAILS with a blank line. Keep the tone warm and
plain-spoken.`;
}

const stopWords = new Set([
  "a", "an", "the", "of", "and", "or", "with", "for", "to", "in", "on", "at",
  "photo", "image", "picture", "showing", "featuring", "some", "our", "your",
  "close", "up", "shot", "view", "background", "beautiful", "nice",
]);

/** The words worth searching on. Short queries match far better than long
    ones, so this keeps only the two strongest terms. */
export function imageKeywords(description: string) {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 2);
}

/* Commons holds far more than photographs. These titles are never what a
   newsletter wants, so they are skipped in favour of the next candidate. */
const notAPhoto =
  /\b(map|coat of arms|logo|diagram|chart|seal of|flag of|stamp|poster|screenshot|signature|barcode|icon|graph|plan of|blazon|banknote|coin|document|manuscript|title page|cover of|print|painting|drawing|illustration|wallpaper|engraving|lithograph|sketch|artwork|mural|textile|pattern|font|letterhead)\b/i;

type CommonsPage = {
  index: number;
  title: string;
  imageinfo?: { thumburl?: string; width?: number }[];
};

async function commonsSearch(terms: string, signal?: AbortSignal) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" +
    encodeURIComponent("filetype:bitmap " + terms) +
    "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size" +
    "&iiurlwidth=1200&format=json&origin=*";
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    query?: { pages?: Record<string, CommonsPage> };
  };
  return Object.values(body.query?.pages ?? {}).sort(
    (a, b) => a.index - b.index,
  );
}

/** Find a real photo for a description.

    No image API key is configured, so this searches Wikimedia Commons, which
    is keyless and CORS-friendly. It returns null rather than an unrelated
    picture — an empty image block the user can fill beats a wrong photo. */
export async function searchPhoto(
  description: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const words = imageKeywords(description);
  if (!words.length) return null;
  // Try the whole phrase first, then fall back to the strongest single word.
  const attempts =
    words.length > 1 ? [words.join(" "), words[0]] : [words[0]];
  try {
    for (const terms of attempts) {
      for (const page of await commonsSearch(terms, signal)) {
        const title = page.title.replace(/^File:/, "");
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) continue;
        if (notAPhoto.test(title)) continue;
        // Small files are usually icons or crops, not usable photography.
        if ((info.width ?? 0) < 800) continue;
        // The title must mention what was asked for, or it is a stray hit.
        if (!words.some((w) => title.toLowerCase().includes(w))) continue;
        return info.thumburl;
      }
    }
  } catch {
    return null; // Offline or blocked: leave the block empty.
  }
  return null;
}

/** Fill in photos for any image block that only carries a description. */
export async function resolvePhotos(draft: Draft): Promise<Draft> {
  const blocks = await Promise.all(
    draft.blocks.map(async (b) => {
      if (b.type !== "Image" || b.src || !b.text) return b;
      const src = await searchPhoto(b.text);
      return src ? { ...b, src } : b;
    }),
  );
  return { ...draft, blocks };
}

export const chatUrl = (tool: "chatgpt" | "claude", prompt: string) =>
  tool === "chatgpt"
    ? "https://chatgpt.com/?q=" + encodeURIComponent(prompt)
    : "https://claude.ai/new?q=" + encodeURIComponent(prompt);

export type Draft = { title: string; blocks: Block[] };

/** Parse an assistant reply into blocks. Returns no blocks if nothing usable. */
export function parseDraft(input: string): Draft {
  const text = input.replace(/\r/g, "").trim();
  if (!text) return { title: "", blocks: [] };

  const blocks: Block[] = [];
  const push = (type: string, body: string, src?: string) => {
    const value = body.trim();
    if (type !== "Divider" && !value && !src) return;
    blocks.push(
      src ? { id: uid(), type, text: value, src } : { id: uid(), type, text: value },
    );
  };

  // Strip code fences the assistant may have wrapped the reply in.
  const clean = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
  const lines = clean.split("\n");
  const labelled = /^\s*([A-Za-z ]{3,14})\s*:\s*(.*)$/;

  let current: { type: string; body: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const body = current.body.join("\n").trim();
    if (current.type === "Image") {
      // A real link is used as-is; a description is looked up later, in
      // resolvePhotos, because the search is asynchronous.
      if (/^https?:\/\//.test(body)) push("Image", "", body);
      else push("Image", body);
    } else if (current.type === "Video") {
      push("Video", "", body);
    } else push(current.type, body);
    current = null;
  };

  let sawLabel = false;
  for (const line of lines) {
    if (/^\s*(DIVIDER|---+|\*\*\*+)\s*$/i.test(line)) {
      flush();
      push("Divider", "");
      sawLabel = sawLabel || /divider/i.test(line);
      continue;
    }
    const m = line.match(labelled);
    const key = m?.[1].trim().toLowerCase();
    if (m && key && labels[key]) {
      flush();
      sawLabel = true;
      current = { type: labels[key], body: [m[2]] };
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();

  if (!sawLabel) return parseMarkdown(clean);

  const title = blocks.find((b) => b.type === "Title")?.text || "";
  return { title, blocks };
}

/** Fallback for a reply that ignored the labels and just wrote Markdown. */
function parseMarkdown(text: string): Draft {
  const blocks: Block[] = [];
  let title = "";
  for (const chunk of text.split(/\n{2,}/)) {
    const part = chunk.trim();
    if (!part) continue;
    if (/^---+$|^\*\*\*+$/.test(part)) {
      blocks.push({ id: uid(), type: "Divider", text: "" });
      continue;
    }
    const image = part.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
    if (image) {
      blocks.push({ id: uid(), type: "Image", text: "", src: image[1] });
      continue;
    }
    const heading = part.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const body = heading[2].trim();
      if (!title) {
        title = body;
        blocks.push({ id: uid(), type: "Title", text: body });
      } else {
        blocks.push({ id: uid(), type: "Featured story", text: body });
      }
      continue;
    }
    // Strip Markdown emphasis and list markers; blocks carry their own styling.
    const body = part
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|\s)\*(?!\s)(.+?)\*/g, "$1$2")
      .trim();
    if (!title) {
      title = body.split("\n")[0].slice(0, 80);
      blocks.push({ id: uid(), type: "Title", text: title });
      continue;
    }
    blocks.push({ id: uid(), type: "Rich text", text: body });
  }
  return { title, blocks };
}
