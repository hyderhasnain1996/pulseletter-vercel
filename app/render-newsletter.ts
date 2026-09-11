import type { Issue } from "./data";
import { themeById } from "./themes";

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

/** Where the full issue lives. Emails need an absolute address. */
export const readUrl = (issue: Issue, origin?: string) =>
  (origin ?? "") + "/newsletters/" + issue.id + "/read";

/* What an email is allowed to say.

   The email is a taster, not the whole issue: one photo, the headline, the
   opening line and the key takeaways. The depth — every Details block, the
   extra pictures — waits on the full issue page behind the button. That keeps
   the message short, quick to load, and less likely to be clipped by Gmail. */
function teaser(issue: Issue) {
  const cover = issue.blocks.find((b) => b.type === "Image" && b.src);
  const intro = issue.blocks.find((b) => b.type === "Introduction");
  const points = issue.blocks
    .filter((b) => b.type === "Featured story" && b.text)
    .slice(0, 3);
  const button = issue.blocks.find((b) => b.type === "Button" && b.text);
  const extras = issue.blocks.filter(
    (b) =>
      (b.type === "Details" && b.text) ||
      (b.type === "Image" && b.src && b !== cover) ||
      (b.type === "Video" && b.src),
  ).length;
  return { cover, intro, points, button, extras };
}

export function renderPlainText(issue: Issue, brand: string, origin?: string) {
  const { intro, points } = teaser(issue);
  return [
    brand,
    issue.title,
    issue.issue,
    "",
    intro?.text ?? "",
    "",
    ...points.map((p) => "• " + p.text),
    "",
    "Read the full issue: " + readUrl(issue, origin),
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");
}

export function renderEmail(issue: Issue, brand: string, origin?: string) {
  const t = themeById(issue.theme);
  const { cover, intro, points, button, extras } = teaser(issue);
  const pad = "padding-left:32px;padding-right:32px";
  const link = escapeHtml(readUrl(issue, origin));
  const label = escapeHtml(button?.text || "Read the full issue");

  const rows = [
    `<tr><td style="${pad};padding-top:26px;font-size:11px;letter-spacing:2px;color:${t.accent}">${escapeHtml(brand.toUpperCase())} &middot; ${escapeHtml(issue.issue)}</td></tr>`,
    `<tr><td style="${pad};padding-top:14px"><h1 style="margin:0;font-family:${t.head};font-size:33px;line-height:1.15;color:${t.ink}">${escapeHtml(issue.title)}</h1></td></tr>`,
    cover?.src
      ? `<tr><td style="${pad};padding-top:22px"><img src="${escapeHtml(cover.src)}" alt="${escapeHtml(cover.text || issue.title)}" width="536" style="width:100%;max-width:536px;display:block;border-radius:6px"></td></tr>`
      : "",
    intro?.text
      ? `<tr><td style="${pad};padding-top:22px"><p style="margin:0;font-size:17px;line-height:1.7;color:${t.ink}">${escapeHtml(intro.text).replace(/\n/g, "<br>")}</p></td></tr>`
      : "",
    points.length
      ? `<tr><td style="${pad};padding-top:22px">${points
          .map(
            (p) =>
              `<p style="margin:0 0 14px;padding-left:14px;border-left:3px solid ${t.accent};font-size:16px;line-height:1.6;color:${t.muted}">${escapeHtml(p.text)}</p>`,
          )
          .join("")}</td></tr>`
      : "",
    `<tr><td style="${pad};padding-top:10px;padding-bottom:6px" align="center"><a href="${link}" style="display:inline-block;padding:14px 30px;border-radius:4px;background:${t.accent};color:${t.onAccent};font-size:15px;text-decoration:none">${label} &rarr;</a></td></tr>`,
    extras
      ? `<tr><td style="${pad};padding-top:4px" align="center"><p style="margin:0;font-size:12px;color:${t.muted}">Plus ${extras} more ${extras === 1 ? "section" : "sections"} in the full issue.</p></td></tr>`
      : "",
    `<tr><td style="${pad};padding-top:26px;padding-bottom:26px;font-size:12px;line-height:1.7;color:${t.muted};border-top:1px solid ${t.rule}">${escapeHtml(brand)} &middot; <a href="${link}" style="color:${t.accent}">View this issue online</a><br>Preview only. Configure your sender address and unsubscribe link before sending.</td></tr>`,
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(issue.title)}</title></head><body style="margin:0;background:#eef1f3;font-family:Arial,Helvetica,sans-serif;color:${t.ink}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef1f3"><tr><td align="center" style="padding:22px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:${t.bg};border-radius:10px;overflow:hidden">${rows}</table></td></tr></table></body></html>`;
}

export function renderMobile(issue: Issue) {
  return `${issue.title}: ${issue.blocks.find((b) => b.type === "Introduction")?.text || ""}`.slice(
    0,
    140,
  );
}
