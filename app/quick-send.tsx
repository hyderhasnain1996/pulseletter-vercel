"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ImagePlus,
  Upload,
  Link2,
  Send,
  Trash2,
  Sparkles,
  CheckCheck,
  MousePointerClick,
  FileText,
  Monitor,
} from "lucide-react";
import type { Issue } from "./data";
import { compressImage } from "./media";
import { renderImageEmail, readUrl } from "./render-newsletter";
import { splitRecipients } from "./recipients";

/* Quick send.

   The whole studio assumes you want to build an issue out of blocks. Often
   the thing you want to send already exists as one picture — a poster, a
   flyer, a scanned page — or as a page of HTML someone else wrote. This is
   the short way round: drop the file in, say where tapping it should go, and
   send. Nothing is saved to the workspace, because there is nothing here to
   come back and edit. */

type Ready =
  | { kind: "image"; src: string; name: string }
  | { kind: "html"; source: string; name: string };

const isHtmlFile = (f: File) =>
  f.type === "text/html" || /\.x?html?$/i.test(f.name);

export function QuickSend({
  brand,
  issues,
  origin,
}: {
  brand: string;
  issues: Issue[];
  origin: string;
}) {
  const [file, setFile] = useState<Ready | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* Empty means the picture is not a link — the "just the picture" case. */
  const [linkTo, setLinkTo] = useState("");
  const [typed, setTyped] = useState("");
  const [caption, setCaption] = useState("");

  const [list, setList] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const picker = useRef<HTMLInputElement>(null);
  const depth = useRef(0); // dragenter/leave fire per child; count them

  const linked = issues.find((n) => n.id === linkTo);
  const href = linked ? readUrl(linked, origin) : undefined;

  /* A subject is the one thing a picture cannot supply for itself, so the
     chosen newsletter's title stands in until someone types over it. Derived
     rather than copied into state, so picking a different newsletter updates
     the suggestion without an effect racing the keystrokes. */
  const subject = typed || linked?.title || "";

  async function accept(chosen: File | undefined) {
    if (!chosen) return;
    setResult("");
    if (isHtmlFile(chosen)) {
      setReading(true);
      try {
        const source = await chosen.text();
        if (!source.trim()) throw Error("That file is empty.");
        setFile({ kind: "html", source, name: chosen.name });
        toast.success("HTML ready to send");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "That file could not be read.");
      } finally {
        setReading(false);
      }
      return;
    }
    if (!chosen.type.startsWith("image/")) {
      toast.error("Choose a picture (JPEG, PNG, GIF, WebP…) or an .html file.");
      return;
    }
    setReading(true);
    try {
      /* Same shrink the editor uses, so a phone photo does not arrive as a
         12MB attachment nobody can download on mobile data. */
      setFile({ kind: "image", src: await compressImage(chosen), name: chosen.name });
      toast.success("Picture ready to send");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That picture didn't load.");
    } finally {
      setReading(false);
    }
  }

  function addRecipients(raw: string) {
    const { valid, invalid } = splitRecipients(raw, "Email");
    if (valid.length) setList((l) => [...new Set([...l, ...valid])]);
    setDraft("");
    if (invalid.length)
      toast.error(
        invalid.length === 1
          ? `${invalid[0]} is not a valid email address.`
          : `${invalid.length} entries are not valid email addresses.`,
      );
  }

  /* What actually goes down the wire. HTML is sent exactly as written — it is
     already a finished page, and second-guessing it would only break it. */
  function buildHtml() {
    if (!file) return "";
    if (file.kind === "html") return file.source;
    return renderImageEmail({
      src: file.src,
      alt: subject || linked?.title || brand,
      brand,
      caption: caption.trim() || undefined,
      href,
      label: "Read the full issue",
      theme: linked?.theme,
    });
  }

  async function send() {
    if (!file || !list.length || sending) return;
    setSending(true);
    setResult("");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "Email",
          to: list,
          subject: subject.trim() || brand,
          html: buildHtml(),
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        sent?: number;
        failed?: number;
        results?: { ok: boolean; error?: string }[];
      };
      if (!res.ok) setResult(body.error ?? "Unable to send right now.");
      else if (body.failed) {
        const reason = body.results?.find((r) => !r.ok)?.error;
        setResult(
          `Sent to ${body.sent} of ${list.length}.` + (reason ? ` ${reason}` : ""),
        );
      } else {
        setResult(`Sent to ${body.sent === 1 ? "1 person" : body.sent + " people"}.`);
        toast.success("On its way");
      }
    } catch {
      setResult("Network error — nothing was sent.");
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(file) && list.length > 0 && !sending;

  return (
    <div className="qs">
      <header className="qs-head">
        <span className="qs-eyebrow">
          <Sparkles size={13} /> Quick send
        </span>
        <h1>Send a picture as the whole newsletter.</h1>
        <p>
          Drop in a poster, a flyer, a scanned page — or a finished HTML file —
          and send it as it is. Tapping the picture can open the full issue, or
          it can simply be a picture.
        </p>
      </header>

      <div className="qs-grid">
        {/* ---------------- the stage ---------------- */}
        <section className="qs-stage">
          {!file ? (
            <div
              className={"qs-drop" + (dragging ? " is-over" : "") + (reading ? " is-busy" : "")}
              onDragEnter={(e) => {
                e.preventDefault();
                depth.current += 1;
                setDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault();
                depth.current -= 1;
                if (depth.current <= 0) setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                depth.current = 0;
                setDragging(false);
                accept(e.dataTransfer.files[0]);
              }}
              onClick={() => picker.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  picker.current?.click();
                }
              }}
            >
              <span className="qs-drop-glow" aria-hidden="true" />
              <span className="qs-drop-icon">
                {reading ? <Upload size={26} /> : <ImagePlus size={26} />}
              </span>
              <strong>{reading ? "Reading your file…" : "Drop a picture here"}</strong>
              <span className="qs-drop-sub">
                or <u>choose a file</u> — JPEG, PNG, GIF, WebP, or .html
              </span>
              <input
                ref={picker}
                type="file"
                accept="image/*,.html,.htm,text/html"
                hidden
                onChange={(e) => {
                  accept(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <figure className="qs-preview">
              <div className="qs-preview-bar">
                <span className="qs-chip">
                  {file.kind === "html" ? <FileText size={12} /> : <Monitor size={12} />}
                  {file.name}
                </span>
                <button
                  className="qs-clear"
                  onClick={() => {
                    setFile(null);
                    setResult("");
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>

              <div className={"qs-canvas" + (href ? " is-link" : "")}>
                {file.kind === "image" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={file.src} alt={subject || "Your newsletter"} />
                ) : (
                  <iframe
                    title="HTML preview"
                    srcDoc={file.source}
                    sandbox=""
                    className="qs-frame"
                  />
                )}
                {href && (
                  <span className="qs-tap">
                    <MousePointerClick size={13} /> opens the full issue
                  </span>
                )}
              </div>
              <figcaption>
                {file.kind === "html"
                  ? "Sent exactly as written."
                  : href
                    ? "Recipients tap the picture to read the rest."
                    : "Just the picture — nothing to tap."}
              </figcaption>
            </figure>
          )}
        </section>

        {/* ---------------- the controls ---------------- */}
        <section className="qs-controls">
          <div className="qs-field qs-reveal" style={{ ["--i" as string]: 0 }}>
            <label htmlFor="qs-subject">Subject</label>
            <input
              id="qs-subject"
              value={subject}
              placeholder={linked?.title || brand}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>

          {file?.kind !== "html" && (
            <>
              <div className="qs-field qs-reveal" style={{ ["--i" as string]: 1 }}>
                <label>When someone taps the picture</label>
                <div className="qs-choices">
                  <button
                    className={"qs-choice" + (linkTo === "" ? " is-on" : "")}
                    onClick={() => setLinkTo("")}
                  >
                    <ImagePlus size={15} />
                    <span>
                      <strong>Just the picture</strong>
                      <small>Nothing happens</small>
                    </span>
                  </button>
                  <button
                    className={"qs-choice" + (linkTo !== "" ? " is-on" : "")}
                    onClick={() =>
                      setLinkTo(linkTo || issues[0]?.id || "")
                    }
                    disabled={!issues.length}
                  >
                    <Link2 size={15} />
                    <span>
                      <strong>Open a newsletter</strong>
                      <small>The full issue</small>
                    </span>
                  </button>
                </div>
              </div>

              {linkTo !== "" && (
                <div className="qs-field qs-reveal" style={{ ["--i" as string]: 2 }}>
                  <label htmlFor="qs-issue">Which newsletter</label>
                  <select
                    id="qs-issue"
                    value={linkTo}
                    onChange={(e) => setLinkTo(e.target.value)}
                  >
                    {issues.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="qs-field qs-reveal" style={{ ["--i" as string]: 3 }}>
                <label htmlFor="qs-caption">
                  A line under the picture <small>optional</small>
                </label>
                <textarea
                  id="qs-caption"
                  rows={2}
                  value={caption}
                  placeholder="Say what this is, if it needs saying."
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="qs-field qs-reveal" style={{ ["--i" as string]: 4 }}>
            <label htmlFor="qs-to">Send to</label>
            <div className="qs-chips">
              {list.map((address) => (
                <span key={address} className="qs-to">
                  {address}
                  <button
                    onClick={() => setList((l) => l.filter((x) => x !== address))}
                    aria-label={`Remove ${address}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="qs-to"
                value={draft}
                placeholder={list.length ? "Add another…" : "name@example.com"}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipients(draft);
                  }
                }}
                onBlur={() => draft.trim() && addRecipients(draft)}
              />
            </div>
          </div>

          <button
            className={"qs-send" + (sending ? " is-sending" : "")}
            disabled={!canSend}
            onClick={send}
          >
            {sending ? (
              <>Sending…</>
            ) : (
              <>
                <Send size={15} />
                Send{list.length ? ` to ${list.length}` : ""}
              </>
            )}
          </button>

          {result && (
            <p className="qs-result">
              <CheckCheck size={14} /> {result}
            </p>
          )}
          {!file && (
            <p className="qs-hint">Add a picture or an HTML file to send.</p>
          )}
        </section>
      </div>
    </div>
  );
}
