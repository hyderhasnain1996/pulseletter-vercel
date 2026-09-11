import { notFound } from "next/navigation";
import { getDb, hasDatabase } from "@/db";
import { workspaces } from "@/db/schema";
import { themeVars } from "@/app/themes";
import { NotifyButton } from "@/app/notify-button";
import type { Issue, State } from "@/app/data";

/* The full issue, served on its own.

   This is the link readers are sent, so it must work without an account and
   without the studio around it. It reads the issue straight from the database
   on the server rather than loading a workspace in the browser. */

export const dynamic = "force-dynamic";

async function findIssue(
  id: string,
): Promise<{ issue: Issue; brand: string } | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await getDb().select().from(workspaces);
    for (const row of rows) {
      const state = JSON.parse(row.data) as State;
      const issue = state.issues?.find((i) => i.id === id);
      if (issue) return { issue, brand: state.brand };
    }
  } catch {
    return null;
  }
  return null;
}

const readingMinutes = (issue: Issue) =>
  Math.max(
    1,
    Math.round(
      issue.blocks.reduce(
        (n, b) => n + b.text.split(/\s+/).filter(Boolean).length,
        0,
      ) / 200,
    ),
  );

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const found = await findIssue((await params).id);
  if (!found) return { title: "Newsletter" };
  const intro = found.issue.blocks.find((b) => b.type === "Introduction");
  return {
    title: `${found.issue.title} — ${found.brand}`,
    description: intro?.text.slice(0, 160),
  };
}

export default async function ReadIssue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const found = await findIssue((await params).id);
  if (!found) notFound();
  const { issue, brand } = found;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="reader-page" style={themeVars(issue.theme)}>
      <article className="reader">
        <div className="reader-bar">
          <span className="reader-brand-small">{brand.toUpperCase()}</span>
          <span>
            {issue.category} · {issue.issue}
          </span>
        </div>

        <header className="reader-head">
          <span className="reader-brand">{brand.toUpperCase()}</span>
          <h1>{issue.title}</h1>
          <p className="reader-meta">
            {issue.blocks.filter((b) => b.text).length} sections ·{" "}
            {readingMinutes(issue)} min read
          </p>
        </header>

        <div className="reader-notify">
          <NotifyButton publicKey={vapidKey} />
        </div>

        <div className="reader-body">
          {issue.blocks.map((b) =>
            b.type === "Divider" ? (
              <hr key={b.id} />
            ) : b.type === "Title" ? null : b.type === "Image" ? (
              b.src ? (
                <figure key={b.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.src} alt={b.text || "Newsletter image"} />
                  {b.text && <figcaption>{b.text}</figcaption>}
                </figure>
              ) : null
            ) : b.type === "Video" ? (
              b.src ? (
                <p key={b.id}>
                  <a href={b.src} target="_blank" rel="noopener noreferrer">
                    ▶ Watch the video
                  </a>
                </p>
              ) : null
            ) : b.type === "Button" ? (
              <p key={b.id}>
                <span className="doc-button">{b.text}</span>
              </p>
            ) : b.type === "Featured story" ? (
              <h2 key={b.id}>{b.text}</h2>
            ) : b.type === "Details" ? (
              <div key={b.id} className="reader-detail">
                {b.text.split(/\n{2,}/).map((para, k) => (
                  <p key={k}>{para}</p>
                ))}
              </div>
            ) : b.type === "Introduction" ? (
              <p key={b.id} className="reader-lead">
                {b.text}
              </p>
            ) : (
              <p key={b.id}>{b.text}</p>
            ),
          )}
        </div>

        <footer className="reader-foot">
          {brand} · Thoughtfully curated. Made to be shared.
        </footer>
      </article>
    </div>
  );
}
