"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AutomationForm } from "./automation-form";
import { QuickSend } from "./quick-send";
import { splitRecipients } from "./recipients";
import { LanguageToggle, useT, type Key } from "./i18n";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Users,
  Send,
  Workflow,
  ChartNoAxesCombined,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCheck,
  TriangleAlert,
  MoreHorizontal,
  Sparkles,
  Copy,
  Eye,
  Pencil,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  Upload,
  LogOut,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Type,
  AlignLeft,
  Newspaper,
  Image,
  Megaphone,
  CalendarDays,
  MousePointerClick,
  Minus,
  Share2,
  PanelBottom,
  ImagePlus,
  Clapperboard,
  ChevronsDownUp,
  BookOpen,
  Link2,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "sonner";
import { initial, templates, State, Issue } from "./data";
import {
  renderEmail,
  renderSms,
  smsSegments,
  smsLimit,
  needsUnicodeSms,
  readUrl,
} from "./render-newsletter";
import { parseCSV } from "./csv";
import { compressImage, toEmbed } from "./media";
import { themes, themeVars } from "./themes";
import { layouts, layoutClass } from "./layouts";
import { NotifyButton } from "./notify-button";
import {
  buildPrompt,
  chatUrl,
  parseDraft,
  resolvePhotos,
} from "./import-newsletter";
const nav = [
  ["nav.dashboard", LayoutDashboard, "/dashboard"],
  ["nav.quick", ImagePlus, "/quick"],
  ["nav.newsletters", FileText, "/newsletters"],
  ["nav.contacts", Users, "/contacts"],
  ["nav.automations", Workflow, "/automations"],
] as const;
const uid = () => crypto.randomUUID();
/* Session draft mirror, used when workspace storage is unavailable. */
const DRAFT_KEY = "pulse-draft";
function Choice({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
  /* What to show for a value. The value itself is stored and compared
     elsewhere, so it stays in English whatever the reader sees. */
  label?: (value: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue>{label ? label(value) : value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((x) => (
          <SelectItem key={x} value={x}>
            {label ? label(x) : x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
/* Every block type, with the icon and starter copy used when it is added. */
const blockTypes = [
  ["Title", Type, "Your headline goes here"],
  ["Introduction", AlignLeft, "A short, friendly opening line."],
  ["Featured story", Newspaper, "The story you most want read."],
  ["Details", ChevronsDownUp, "The longer explanation, tucked behind Read more."],
  ["Rich text", AlignLeft, "Write anything you like here."],
  ["Image", ImagePlus, "Add a caption"],
  ["Video", Clapperboard, "Add a caption"],
  ["Image caption", Image, "A few words about the picture."],
  ["Article card", Newspaper, "A link worth clicking."],
  ["Announcement", Megaphone, "Something worth knowing."],
  ["Event", CalendarDays, "What, where and when."],
  ["Button", MousePointerClick, "Read more"],
  ["Divider", Minus, ""],
  ["Social links", Share2, "Find us anywhere."],
  ["Footer", PanelBottom, "Thanks for reading."],
] as const;

/* Click-to-type text on the page itself. Kept uncontrolled while focused so
   the caret never jumps, and committed once on blur so undo stays per-edit. */
function Editable({
  value,
  onCommit,
  as: Tag = "p",
  className = "",
  placeholder = "Type here…",
}: {
  value: string;
  onCommit: (v: string) => void;
  as?: "h1" | "h2" | "p" | "span" | "small";
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value)
      el.innerText = value;
  }, [value]);
  return (
    <Tag
      // @ts-expect-error one ref for every tag this renders
      ref={ref}
      className={"editable " + className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onBlur={() => {
        const next = ref.current?.innerText.replace(/\n+$/, "") ?? "";
        if (next !== value) onCommit(next);
      }}
      onPaste={(e: React.ClipboardEvent) => {
        // Keep pasted copy as plain text; styling comes from the block type.
        if (e.clipboardData.files.length) return;
        const text = e.clipboardData.getData("text/plain");
        if (!text) return;
        e.preventDefault();
        document.execCommand("insertText", false, text);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        if (e.key === "Enter" && Tag !== "p") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    />
  );
}

/* Dates are formatted with a fixed locale and time zone on purpose: the
   server and the browser must produce identical text, or React's hydration
   fails when the visitor's locale differs from the server's. */
const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";


export default function Studio() {
  const router = useRouter(),
    path = usePathname();
  const [data, setData] = useState<State>(initial),
    [persisted, setPersisted] = useState(false),
    [light, setLight] = useState(true),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState(""),
    [filter, setFilter] = useState("All statuses"),
    [selected, setSelected] = useState(""),
    [mobile, setMobile] = useState(false),
    [insertAt, setInsertAt] = useState<number | null>(null),
    [dragging, setDragging] = useState(""),
    [uploading, setUploading] = useState(""),
    [dropTarget, setDropTarget] = useState(""),
    [aiTopic, setAiTopic] = useState(""),
    [aiDraft, setAiDraft] = useState(""),
    [importing, setImporting] = useState(false),
    [aiTheme, setAiTheme] = useState("classic"),
    [aiLayout, setAiLayout] = useState("classic"),
    [sendChannel, setSendChannel] = useState<"Email" | "Push" | "SMS">(
      "Email",
    ),
    [pushCount, setPushCount] = useState<number | null>(null),
    [groupFilter, setGroupFilter] = useState(""),
    [newGroup, setNewGroup] = useState(""),
    [csvText, setCsvText] = useState(""),
    [csvName, setCsvName] = useState(""),
    [csvConsent, setCsvConsent] = useState(false),
    [sendList, setSendList] = useState<string[]>([]),
    [sendDraft, setSendDraft] = useState(""),
    [sending, setSending] = useState(false),
    [sendResult, setSendResult] = useState<string | null>(null),
    [history, setHistory] = useState<Issue[]>([]),
    [future, setFuture] = useState<Issue[]>([]),
    [view, setView] = useState("Cards"),
    [saving, setSaving] = useState(false);
  const { t } = useT();
  useEffect(() => {
    // Light unless this visitor has chosen dark before.
    const savedTheme = localStorage.getItem("pulse-theme") !== "dark";
    queueMicrotask(() => setLight(savedTheme));
    fetch("/api/workspace")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        setData(d as State);
        setPersisted(true);
      })
      .catch(() => {
        // No server storage: fall back to this browser so work survives
        // navigation and reloads. Routing remounts this component, so
        // without this a session draft would be lost on every page change.
        try {
          const cached = localStorage.getItem(DRAFT_KEY);
          if (cached) setData(JSON.parse(cached) as State);
        } catch {}
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    localStorage.setItem("pulse-theme", light ? "light" : "dark");
  }, [light]);
  const writes = useRef(Promise.resolve());
  const pending = useRef(0);
  /* One hidden file input, retargeted at whichever block asked for it. */
  const fileInput = useRef<HTMLInputElement>(null);
  const pickTarget = useRef("");
  const pick = (id: string) => {
    pickTarget.current = id;
    fileInput.current?.click();
  };
  async function save(next: State) {
    setData(next);
    setSaving(true);
    // Mirror locally first so a draft survives even if the server rejects it.
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded (large inlined images) — the server copy still applies.
    }
    pending.current++;
    const write = writes.current.then(async () => {
      try {
        const r = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!r.ok) throw Error();
        setPersisted(true);
      } catch {
        setPersisted(false);
        toast.error(
          "Saved in this browser only. Sign in to sync your workspace.",
        );
      } finally {
        pending.current--;
        if (!pending.current) setSaving(false);
      }
    });
    writes.current = write;
    await write;
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    context.registerTool(
      {
        name: "start_newsletter_creation",
        description:
          "Open the template picker. Does not create or send a newsletter.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute(input: unknown) {
          if (!input || typeof input !== "object" || Object.keys(input).length)
            throw Error("Expected an empty object");
          setModal("create");
          return { status: "template_picker_open" };
        },
      },
      { signal: lifecycle.signal },
    );
    return () => lifecycle.abort();
  }, []);
  /* Paste straight onto the page: a copied image becomes an Image block, a
     copied video/image link becomes the matching block. Plain text pasted
     while typing is left alone so normal editing still behaves. */
  useEffect(() => {
    if (!path.includes("/editor")) return;
    const onPaste = async (e: ClipboardEvent) => {
      const clip = e.clipboardData;
      if (!clip) return;
      const file = Array.from(clip.files).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        e.preventDefault();
        setUploading("paste");
        try {
          addBlock("Image", pasteIndex(), await compressImage(file));
          toast.success(t("ed.imagePasted"));
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "That image didn't load.",
          );
        } finally {
          setUploading("");
        }
        return;
      }
      const text = clip.getData("text/plain").trim();
      if (!text) return;
      // Only take over a link paste when the caret is not in a text field.
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable ||
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA")
      )
        return;
      if (toEmbed(text)) {
        e.preventDefault();
        addBlock("Video", pasteIndex(), text);
        toast.success(t("ed.videoAdded"));
      } else if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i.test(text)) {
        e.preventDefault();
        addBlock("Image", pasteIndex(), text);
        toast.success(t("ed.imageAdded"));
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  const go = (p: string) => {
    setSearch("");
    router.push(p);
  };
  const issue = data.issues.find((x) => path.includes(x.id));
  const aiPreview = parseDraft(aiDraft);
  const groups = [
    ...new Set(data.contacts.map((c) => c.group).filter(Boolean)),
  ].sort();
  const inGroup = (name: string) =>
    data.contacts.filter((c) => c.group === name);

  /* Editing a contact in place: the table is where people actually fix a
     wrong group or grant consent, so both are changeable from the row. */
  /* Contacts this channel can actually reach: subscribed, with the right
     detail on file, and optionally narrowed to one group. */
  const reachable = (group?: string) =>
    data.contacts
      .filter((c) => (group ? c.group === group : true))
      .filter((c) =>
        sendChannel === "Email"
          ? c.subscribed && c.email
          : c.smsSubscribed && c.phone,
      )
      .map((c) => (sendChannel === "Email" ? c.email : c.phone));

  function updateContact(id: string, patch: Partial<(typeof data.contacts)[0]>) {
    save({
      ...data,
      contacts: data.contacts.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  useEffect(() => {
    if (modal !== "send" || sendChannel !== "Push") return;
    setPushCount(null);
    fetch("/api/push/subscribe")
      .then((r) => r.json())
      .then((d: { count?: number }) => setPushCount(d.count ?? 0))
      .catch(() => setPushCount(0));
  }, [modal, sendChannel]);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const navKey = nav.find((x) => x[2] === path)?.[0] as Key | undefined;
  const title = path.includes("/editor")
    ? t("nav.editor")
    : issue
      ? t("title.issue")
      : navKey
        ? t(navKey)
        : t("title.campaign");
  async function create(template: string) {
    const sample =
      initial.issues[templates.indexOf(template)] || initial.issues[0];
    const n = {
      ...structuredClone(sample),
      id: uid(),
      title: "Untitled newsletter",
      updated: new Date().toISOString(),
      status: "Draft",
    };
    await save({ ...data, issues: [n, ...data.issues] });
    setModal("");
    go("/newsletters/" + n.id + "/editor");
  }
  function edit(patch: Partial<Issue>) {
    if (!issue) return;
    setHistory((h) => [...h.slice(-30), structuredClone(issue)]);
    setFuture([]);
    save({
      ...data,
      issues: data.issues.map((x) =>
        x.id === issue.id
          ? { ...x, ...patch, updated: new Date().toISOString() }
          : x,
      ),
    });
  }
  /* Block actions, all reachable straight from the page. */
  function addBlock(type: string, at?: number, src?: string) {
    if (!issue) return;
    const starter = blockTypes.some((b) => b[0] === type)
      ? t(("seed." + type) as Key)
      : "";
    /* Media arrives with its src already resolved, so the block is never
       written twice — a second write would race the first one's state. */
    const b = src
      ? { id: uid(), type, text: "", src }
      : { id: uid(), type, text: starter };
    const blocks = [...issue.blocks];
    blocks.splice(at ?? blocks.length, 0, b);
    edit({ blocks });
    setSelected(b.id);
  }
  /* Where a pasted block should land: under the selection, else at the end. */
  function pasteIndex() {
    if (!issue) return undefined;
    const i = issue.blocks.findIndex((b) => b.id === selected);
    return i < 0 ? undefined : i + 1;
  }
  function moveBlock(id: string, dir: -1 | 1) {
    if (!issue) return;
    const blocks = [...issue.blocks],
      i = blocks.findIndex((b) => b.id === id),
      j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    edit({ blocks });
  }
  function duplicateBlock(id: string) {
    if (!issue) return;
    const blocks = [...issue.blocks],
      i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = { ...blocks[i], id: uid() };
    blocks.splice(i + 1, 0, copy);
    edit({ blocks });
    setSelected(copy.id);
  }
  function removeBlock(id: string) {
    if (!issue) return;
    edit({ blocks: issue.blocks.filter((b) => b.id !== id) });
    if (selected === id) setSelected("");
  }
  function setBlockText(id: string, text: string) {
    if (!issue) return;
    edit({
      blocks: issue.blocks.map((b) => (b.id === id ? { ...b, text } : b)),
    });
  }

  function setBlockSrc(id: string, src: string) {
    if (!issue) return;
    edit({
      blocks: issue.blocks.map((b) => (b.id === id ? { ...b, src } : b)),
    });
  }
  /* Images are shrunk in the browser and stored inline; see media.ts. */
  async function uploadToBlock(id: string, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(
        file.type.startsWith("video/")
          ? t("ed.noVideoFile")
          : t("ed.chooseImage"),
      );
      return;
    }
    setUploading(id);
    try {
      setBlockSrc(id, await compressImage(file));
      toast.success(t("ed.imageAdded"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That image didn't load.");
    } finally {
      setUploading("");
    }
  }

  /* Turn whatever was typed or pasted into chips, keeping the list unique
     and telling the sender plainly about anything that was not usable. */
  function addRecipients(raw: string) {
    const { valid, invalid } = splitRecipients(raw, sendChannel);
    if (valid.length)
      setSendList((list) => [...new Set([...list, ...valid])]);
    setSendDraft("");
    if (invalid.length)
      toast.error(
        (invalid.length === 1
          ? `${invalid[0]} is not a valid `
          : `${invalid.length} entries are not valid `) +
          (sendChannel === "Email" ? "email address." : "phone number."),
      );
  }

  function duplicate(n: Issue) {
    const copy = {
      ...structuredClone(n),
      id: uid(),
      title: n.title + " (copy)",
      status: "Draft",
      public: false,
    };
    save({ ...data, issues: [copy, ...data.issues] });
    toast.success(t("ed.duplicated"));
  }
  function renderCard(n: Issue, index = 0) {
    return (
      <article
        key={n.id}
        className="issue-card"
        style={{ animationDelay: index * 45 + "ms" }}
      >
        <button
          className={"cover cover-" + (templates.indexOf(n.category) % 3)}
          onClick={() => go("/newsletters/" + n.id)}
          aria-label={"Open " + n.title}
        >
          {/* Light across the paper. Decoration only. */}
          <span className="cover-sheen" aria-hidden="true" />
          <span className="cover-brand">
            {data.brand.toUpperCase()} <span>{t("ed.journal")}</span>
          </span>
          <span className="cover-issue">{n.issue} / SEPTEMBER 2026</span>
          <strong>{n.blocks[0]?.text || n.title}</strong>
          <span className="cover-bottom">
            <span className="cover-cat">{n.category}</span>
            <span className="cover-go" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </span>
        </button>
        <div className="issue-info">
          <div className="row">
            <span className={"badge " + n.status.toLowerCase()}>
              {n.status}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={"Actions for " + n.title}>
                <MoreHorizontal size={19} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => go("/newsletters/" + n.id + "/editor")}
                >{t("nl.edit")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicate(n)}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    save({
                      ...data,
                      issues: data.issues.map((x) =>
                        x.id === n.id
                          ? {
                              ...x,
                              status:
                                x.status === "Archived" ? "Draft" : "Archived",
                            }
                          : x,
                      ),
                    });
                    toast.success(
                      n.status === "Archived"
                        ? t("act.Restored")
                        : t("act.Archived"),
                    );
                  }}
                >
                  {n.status === "Archived" ? t("act.Restore") : t("act.Archive")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h3>{n.title}</h3>
          <p>
            Updated{" "}
            {new Date(n.updated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
            <span>{t("ed.byYou")}</span>
          </p>
          <button
            className="details-link"
            onClick={() => go("/newsletters/" + n.id)}
          >
            View details <ArrowRight size={16} />
          </button>
        </div>
      </article>
    );
  }
  /* Image / Video block body: a drop zone until media is set, then the media. */
  function renderMedia(b: Issue["blocks"][number], live: boolean) {
    const isVideo = b.type === "Video";
    const embed = isVideo ? toEmbed(b.src || "") : null;
    const busy = uploading === b.id;
    const media = isVideo ? (
      embed ? (
        embed.kind === "file" ? (
          <video className="doc-media" src={embed.src} controls />
        ) : (
          <iframe
            className="doc-media"
            src={embed.src}
            title={b.text || "Video"}
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )
      ) : null
    ) : b.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="doc-media"
        src={b.src}
        alt={b.text || "Newsletter image"}
        onError={() => {
          // Remote photo did not load — fall back to the upload drop zone
          // rather than leaving a broken image in the newsletter.
          if (b.src?.startsWith("http")) setBlockSrc(b.id, "");
        }}
      />
    ) : null;

    if (!live)
      return (
        <>
          {media}
          {b.text && <small className="doc-caption">{b.text}</small>}
        </>
      );

    return (
      <>
        {media ? (
          <div className="media-holder">
            {media}
            <button
              className="media-clear"
              aria-label={t("ed.removeMedia")}
              onClick={(e) => {
                e.stopPropagation();
                setBlockSrc(b.id, "");
              }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div
            className={"media-drop " + (dropTarget === b.id ? "over" : "")}
            onDragOver={(e) => {
              if (isVideo) return;
              e.preventDefault();
              e.stopPropagation();
              setDropTarget(b.id);
            }}
            onDragLeave={() => setDropTarget("")}
            onDrop={(e) => {
              if (isVideo) return;
              e.preventDefault();
              e.stopPropagation();
              setDropTarget("");
              const file = e.dataTransfer.files?.[0];
              if (file) uploadToBlock(b.id, file);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isVideo) setSelected(b.id);
              else pick(b.id);
            }}
          >
            {busy ? (
              <p>{t("ed.adding")}</p>
            ) : isVideo ? (
              <>
                <Clapperboard size={22} />
                <p>
                  <strong>{t("ed.pasteVideo")}</strong>
                </p>
                <small>{t("ed.pasteHint")}</small>
              </>
            ) : (
              <>
                <ImagePlus size={22} />
                <p>
                  <strong>{t("ed.clickUpload")}</strong> or drop an image here
                </p>
                <small>{t("ed.orPaste")}</small>
              </>
            )}
          </div>
        )}
        {isVideo && (
          <div className="media-link" onClick={(e) => e.stopPropagation()}>
            <Link2 size={14} />
            <input
              value={b.src || ""}
              placeholder="https://youtube.com/watch?v=…"
              onChange={(e) => setBlockSrc(b.id, e.target.value)}
            />
          </div>
        )}
        <Editable
          as="small"
          className="doc-caption"
          value={b.text}
          placeholder={t("ed.caption")}
          onCommit={(v) => setBlockText(b.id, v)}
        />
      </>
    );
  }

  /* A slim "+" rail that drops a new block exactly where it is clicked. */
  function insertRail(at: number) {
    return (
      <div className="insert-rail">
        <button
          className="insert-dot"
          aria-label={t("ed.addHere")}
          onClick={(e) => {
            e.stopPropagation();
            setInsertAt(insertAt === at ? null : at);
          }}
        >
          <Plus size={14} />
        </button>
        {insertAt === at && (
          <div className="insert-menu" onClick={(e) => e.stopPropagation()}>
            {blockTypes.map(([type, Icon]) => (
              <button
                key={type}
                onClick={() => {
                  addBlock(type, at);
                  setInsertAt(null);
                }}
              >
                <Icon size={14} />
                {t(("blk." + type) as Key)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDocument(n: Issue) {
    const live = path.includes("editor");
    return (
      <article
        className={
          "document " + layoutClass(n.layout) + (mobile ? " mobile-doc" : "")
        }
        style={themeVars(n.theme)}
        onClick={() => {
          setSelected("");
          setInsertAt(null);
        }}
      >
        <div className="doc-brand">
          {data.brand.toUpperCase()} <span>{n.issue}</span>
        </div>
        {live && insertRail(0)}
        {n.blocks.map((b, i) => {
          const body = b.type === "Image" || b.type === "Video" ? (
            renderMedia(b, live)
          ) : b.type === "Details" ? (
            <details className="doc-details" open={live && selected === b.id}>
              <summary>
                Read more <ChevronDown size={15} />
              </summary>
              {live ? (
                <Editable
                  value={b.text}
                  placeholder={t("ed.longer")}
                  onCommit={(v) => setBlockText(b.id, v)}
                />
              ) : (
                b.text.split(/\n{2,}/).map((para, k) => <p key={k}>{para}</p>)
              )}
            </details>
          ) : live ? (
            b.type === "Divider" ? (
              <hr />
            ) : b.type === "Title" ? (
              <Editable
                as="h1"
                value={b.text}
                placeholder={t("ed.headline")}
                onCommit={(v) => setBlockText(b.id, v)}
              />
            ) : b.type === "Button" ? (
              <Editable
                as="span"
                className="doc-button"
                value={b.text}
                placeholder={t("ed.buttonLabel")}
                onCommit={(v) => setBlockText(b.id, v)}
              />
            ) : b.type === "Featured story" ? (
              <>
                <small>{t("ed.inFocus")}</small>
                <Editable
                  as="h2"
                  value={b.text}
                  placeholder={t("ed.featured")}
                  onCommit={(v) => setBlockText(b.id, v)}
                />
              </>
            ) : (
              <Editable
                value={b.text}
                placeholder={"Write your " + b.type.toLowerCase() + "…"}
                onCommit={(v) => setBlockText(b.id, v)}
              />
            )
          ) : b.type === "Divider" ? (
            <hr />
          ) : b.type === "Title" ? (
            <h1>{b.text}</h1>
          ) : b.type === "Button" ? (
            <span className="doc-button">{b.text}</span>
          ) : b.type === "Featured story" ? (
            <>
              <small>{t("ed.inFocus")}</small>
              <h2>{b.text}</h2>
            </>
          ) : (
            <p>{b.text}</p>
          );
          return (
            <div key={b.id}>
              <div
                draggable={live && dragging === b.id}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                onDragEnd={() => setDragging("")}
                onDragOver={(e) => live && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const blocks = [...n.blocks],
                    from = blocks.findIndex(
                      (x) => x.id === e.dataTransfer.getData("text/plain"),
                    ),
                    to = blocks.findIndex((x) => x.id === b.id);
                  if (from < 0) return;
                  blocks.splice(to, 0, blocks.splice(from, 1)[0]);
                  edit({ blocks });
                }}
                className={
                  "doc-block " +
                  (live ? "live " : "") +
                  (selected === b.id ? "selected" : "")
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(b.id);
                  setInsertAt(null);
                }}
              >
                {live && (
                  <>
                    <span className="block-tag">{b.type}</span>
                    <div
                      className="block-tools"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        aria-label={t("ed.drag")}
                        className="drag-handle"
                        onMouseDown={() => setDragging(b.id)}
                      >
                        <GripVertical size={14} />
                      </button>
                      <button
                        aria-label={t("ed.moveUp")}
                        disabled={i === 0}
                        onClick={() => moveBlock(b.id, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        aria-label={t("ed.moveDown")}
                        disabled={i === n.blocks.length - 1}
                        onClick={() => moveBlock(b.id, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        aria-label={t("ed.dupBlock")}
                        onClick={() => duplicateBlock(b.id)}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        aria-label={t("ed.delBlock")}
                        className="danger"
                        onClick={() => removeBlock(b.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
                {body}
              </div>
              {live && insertRail(i + 1)}
            </div>
          );
        })}
        {live && !n.blocks.length && (
          <p className="doc-empty">
            Nothing here yet — press a <strong>+</strong> above to add your
            first block.
          </p>
        )}
        {!live && (
          <p className="doc-readmore">
            <button
              className="doc-button"
              onClick={(e) => {
                e.stopPropagation();
                go("/newsletters/" + n.id + "/read");
              }}
            >
              Read the full issue →
            </button>
          </p>
        )}
        <footer>
          {t("rd.curated")}
          <br />
          {data.brand} · Subscription preferences
        </footer>
      </article>
    );
  }
  /* The full issue is what a reader is sent, so it stands on its own:
     no sidebar, no workspace chrome, just the newsletter. */
  if (issue && path.includes("/read"))
    return (
      <div className="reader-page" style={themeVars(issue.theme)}>
          <article
            className={"reader " + layoutClass(issue.layout)}
            style={themeVars(issue.theme)}
          >
            <div className="reader-bar">
              <span className="reader-brand-small">
                {data.brand.toUpperCase()}
              </span>
              <span>
                {issue.category} · {issue.issue}
              </span>
            </div>
            <header className="reader-head">
              <span className="reader-brand">
                {data.brand.toUpperCase()}
              </span>
              <h1>{issue.title}</h1>
              <p className="reader-meta">
                Updated {fmtDate(issue.updated)} ·{" "}
                {issue.blocks.filter((b) => b.text).length} sections ·{" "}
                {Math.max(
                  1,
                  Math.round(
                    issue.blocks.reduce(
                      (n2, b) => n2 + b.text.split(/\s+/).filter(Boolean).length,
                      0,
                    ) / 200,
                  ),
                )}{" "}
                min read
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
                  // The whole point of this page: nothing stays folded away.
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
              {data.brand} · Thoughtfully curated. Made to be shared.
            </footer>
          </article>
      </div>
    );

  return (
    <SidebarProvider>
      <Sidebar className="studio-sidebar">
        <SidebarHeader>
          <button className="brand" onClick={() => go("/dashboard")}>
            <span className="brand-icon">
              <Activity size={23} />
            </span>
            {data.brand}
            <span className="brand-period">.</span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <span className="nav-caption">{t("nav.workspace")}</span>
          <nav>
            {nav.map(([label, Icon, url]) => (
              <button
                key={url}
                className={
                  path === url ||
                  (url === "/newsletters" && path.startsWith(url))
                    ? "active"
                    : ""
                }
                onClick={() => go(url)}
              >
                <Icon size={19} />
                {t(label as Key)}
                {label === "nav.newsletters" && (
                  <span className="nav-count">{data.issues.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="tiny-icon">
              <Sparkles size={17} />
            </span>
            <h4>{t("side.title")}</h4>
            <p>{t("side.sub")}</p>
            <button onClick={() => setModal("create")}>
              {t("side.cta")} <ArrowUpRight size={15} />
            </button>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="profile">
            <span className="avatar">JD</span>
            <span>
              {t("profile.workspace")}
              <small>{t("profile.access")}</small>
            </span>
            <button
              aria-label={t("action.signOut")}
              onClick={() => {
                window.location.href = "/api/auth/signout";
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="shell">
        <header className="topbar">
          <div className="row">
            <SidebarTrigger />
            <span className="breadcrumb">
              {t("top.crumb")} <ChevronRight size={14} /> <b>{title}</b>
            </span>
          </div>
          <div className="top-actions">
            <div className="searchbox">
              <Search size={16} />
              <input
                placeholder={t("top.search")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (path != "/newsletters") router.push("/newsletters");
                }}
              />
              <kbd>⌘ K</kbd>
            </div>
            <LanguageToggle />
            <button
              aria-label={t("action.theme")}
              onClick={() => setLight(!light)}
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              aria-label={t("action.notifications")}
              onClick={() => setModal("notifications")}
            >
              <Bell size={18} />
            </button>
            <span className="avatar small">JD</span>
          </div>
        </header>
        <main className="main">
          <div className="demo-banner">
            <span>
              <span className="demo-dot" />
              {t("banner.demo")}{" "}
              <span className="muted">{t("banner.demoNote")}</span>
            </span>
            <button onClick={() => go("/newsletters")}>
              Your newsletters <ArrowRight size={14} />
            </button>
          </div>
          {path === "/dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{t("db.eyebrow")}</div>
                  <h1>
                    A little pulse. A lot of possibility<span>.</span>
                  </h1>
                  <p>{t("db.bring")}</p>
                </div>
                <button className="primary" onClick={() => setModal("create")}>
                  <Plus size={18} />{t("nl.create")}</button>
              </div>
              <div className="section-top">
                <span className="section-label">{t("db.overview")}</span>
                <span className="period">
                  <Clock size={14} />{t("db.last30")}<ChevronDown size={14} />
                </span>
              </div>
              <div className="stats">
                {[
                  [
                    FileText,
                    "Saved newsletters",
                    data.issues.filter((x) => x.status !== "Archived").length,
                    "Your ideas, in one place",
                    "cyan",
                  ],
                  [
                    CheckCheck,
                    "Delivered messages",
                    0,
                    "No live deliveries yet",
                    "teal",
                  ],
                  [
                    TriangleAlert,
                    "Failed deliveries",
                    0,
                    "Nothing needs your attention",
                    "coral",
                  ],
                  [
                    Clock,
                    "Upcoming campaigns",
                    data.campaigns.filter(
                      (x) => x.status === "Scheduled (demo)",
                    ).length,
                    "Ready when you are",
                    "violet",
                  ],
                ].map(([Icon, label, num, caption, color]) => {
                  const I = Icon as typeof FileText;
                  return (
                    <div className="stat" key={String(label)}>
                      <div className="row">
                        <span>{String(label)}</span>
                        <I className={String(color)} size={18} />
                      </div>
                      <strong>{String(num)}</strong>
                      <small>{String(caption)}</small>
                    </div>
                  );
                })}
              </div>
              <div className="dashboard-grid">
                <section className="panel trend">
                  <div className="panel-heading">
                    <div>
                      <h2>{t("db.delivery")}</h2>
                      <p>{t("db.deliverySub")}</p>
                    </div>
                    <span className="legend">
                      <i />
                      Email <i />
                      SMS
                    </span>
                  </div>
                  <div className="chart">
                    <div className="chart-y">
                      <span>1,000</span>
                      <span>750</span>
                      <span>500</span>
                      <span>250</span>
                      <span>0</span>
                    </div>
                    <div className="chart-plot">
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                      <div className="chart-empty">
                        <span className="chart-icon">
                          <ChartNoAxesCombined size={22} />
                        </span>
                        <strong>{t("db.empty")}</strong>
                        <p>{t("db.trends")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="chart-x">
                    <span>Aug 13</span>
                    <span>Aug 20</span>
                    <span>Aug 27</span>
                    <span>Sep 03</span>
                    <span>Sep 11</span>
                  </div>
                </section>
                <section className="panel schedule">
                  <div className="panel-heading">
                    <h2>{t("db.upNext")}</h2>
                    <span className="subtle-label">UTC</span>
                  </div>
                  <div className="calendar-icon">
                    <Clock size={25} />
                  </div>
                  <h3>{t("db.cleanSlate")}</h3>
                  <p>{t("db.writeNext")}</p>
                  <button onClick={() => setModal("create")}>{t("md.createNewsletter")}<ArrowRight size={15} />
                  </button>
                  <div className="schedule-foot">
                    <span className="badge draft">
                      {data.campaigns.length} campaigns
                    </span>
                    <span>{t("db.utc")}</span>
                  </div>
                </section>
              </div>
              <div className="section-top recent-heading">
                <div>
                  <h2>{t("db.recent")}</h2>
                  <p>{t("db.recentSub")}</p>
                </div>
                <button onClick={() => go("/newsletters")}>
                  View all newsletters <ArrowRight size={16} />
                </button>
              </div>
              <div className="issue-grid">
                {data.issues
                  .filter((x) => x.status !== "Archived")
                  .slice(0, 3)
                  .map((n, i) => renderCard(n, i))}
              </div>
              <div className="setup-strip">
                <span className="setup-icon">
                  <Send size={20} />
                </span>
                <div>
                  <h3>{t("db.closer")}</h3>
                  <p>{t("db.connect")}</p>
                </div>
                <button onClick={() => setModal("create")}>{t("md.createNewsletter")}<ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {path === "/newsletters" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{t("nl.eyebrow")}</div>
                  <h1>{t("nl.title")}</h1>
                  <p>{t("nl.sub")}</p>
                </div>
                <button className="primary" onClick={() => setModal("create")}>
                  <Plus size={17} />{t("nl.create")}</button>
              </div>
              <div className="filters">
                <div className="searchbox">
                  <Search size={17} />
                  <input
                    placeholder={t("nl.find")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Choice
                  value={filter}
                  onChange={setFilter}
                  items={["All statuses", "Draft", "Ready", "Archived"]}
                  label={(v) => t(("st." + v) as Key)}
                />
                <Choice
                  value={view}
                  onChange={setView}
                  items={["Cards", "Table"]}
                  label={(v) => t(("vw." + v) as Key)}
                />
              </div>
              {view === "Cards" ? (
                <div className="issue-grid">
                  {data.issues
                    .filter(
                      (n) =>
                        n.title.toLowerCase().includes(search.toLowerCase()) &&
                        (filter === "All statuses"
                          ? n.status !== "Archived"
                          : n.status === filter),
                    )
                    .map((n, i) => renderCard(n, i))}
                </div>
              ) : (
                <div className="panel">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("nl.colTitle")}</TableHead>
                        <TableHead>{t("nl.colStatus")}</TableHead>
                        <TableHead>{t("nl.colUpdated")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.issues
                        .filter(
                          (n) =>
                            n.title
                              .toLowerCase()
                              .includes(search.toLowerCase()) &&
                            (filter === "All statuses"
                              ? n.status !== "Archived"
                              : n.status === filter),
                        )
                        .map((n) => (
                          <TableRow key={n.id}>
                            <TableCell>{n.title}</TableCell>
                            <TableCell>{n.status}</TableCell>
                            <TableCell>
                              {fmtDate(n.updated)}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => go("/newsletters/" + n.id)}
                              >
                                View details →
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
          {issue && path.includes("/editor") && (
            <>
              <div className="editor-heading">
                <div>
                  <input
                    aria-label={t("ed.title")}
                    className="title-input"
                    value={issue.title}
                    onChange={(e) => edit({ title: e.target.value })}
                  />
                  <small>
                    {saving
                      ? "Saving…"
                      : persisted
                        ? "Saved to workspace"
                        : "Saved in this browser"}
                  </small>
                </div>
                <div className="row">
                  <button
                    aria-label={t("ed.undo")}
                    disabled={!history.length}
                    onClick={() => {
                      const prev = history.at(-1)!;
                      setFuture([...future, issue]);
                      setHistory(history.slice(0, -1));
                      save({
                        ...data,
                        issues: data.issues.map((x) =>
                          x.id === issue.id ? prev : x,
                        ),
                      });
                    }}
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    aria-label={t("ed.redo")}
                    disabled={!future.length}
                    onClick={() => {
                      const next = future.at(-1)!;
                      setHistory([...history, issue]);
                      setFuture(future.slice(0, -1));
                      save({
                        ...data,
                        issues: data.issues.map((x) =>
                          x.id === issue.id ? next : x,
                        ),
                      });
                    }}
                  >
                    <Redo2 size={18} />
                  </button>
                  <button onClick={() => setMobile(!mobile)}>
                    {mobile ? <Monitor size={18} /> : <Smartphone size={18} />}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => go("/newsletters/" + issue.id)}
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      setSendList([]);
                      setSendDraft("");
                      setSendResult(null);
                      setModal("send");
                    }}
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && pickTarget.current)
                    uploadToBlock(pickTarget.current, file);
                  e.target.value = "";
                }}
              />
              <div className="editor-grid">
                <aside className="panel block-library">
                  <h3>{t("ed.addBlock")}</h3>
                  <p>
                    {selected
                      ? "Drops in below the block you picked."
                      : "Drops in at the end of the page."}
                  </p>
                  <div className="block-grid">
                    {blockTypes.map(([type, Icon]) => (
                      <button
                        key={type}
                        title={t(("blk." + type) as Key)}
                        onClick={() => {
                          const i = issue.blocks.findIndex(
                            (b) => b.id === selected,
                          );
                          addBlock(type, i < 0 ? undefined : i + 1);
                        }}
                      >
                        <Icon size={17} />
                        {t(("blk." + type) as Key)}
                      </button>
                    ))}
                  </div>
                </aside>
                <div className="canvas">{renderDocument(issue)}</div>
                <aside className="panel block-settings">
                  <h3>{t("ed.howTo")}</h3>
                  <ul className="how-to">
                    <li>{t("ed.howText")}</li>
                    <li>{t("ed.howBlock")}</li>
                    <li>{t("ed.howPaste")}</li>
                    <li>
                      Press <strong>+</strong> between blocks to add one there.
                    </li>
                  </ul>
                  {issue.blocks.find((b) => b.id === selected) && (
                    <>
                      <hr />
                      <h3>{t("ed.selected")}</h3>
                      <Choice
                        value={
                          issue.blocks.find((b) => b.id === selected)!.type
                        }
                        onChange={(type) =>
                          edit({
                            blocks: issue.blocks.map((b) =>
                              b.id === selected ? { ...b, type } : b,
                            ),
                          })
                        }
                        items={blockTypes.map((b) => b[0])}
                        label={(v) => t(("blk." + v) as Key)}
                      />
                    </>
                  )}
                  <hr />
                  <h3>Look</h3>
                  <div className="theme-picker">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        title={t.name}
                        className={
                          (issue.theme ?? "classic") === t.id ? "active" : ""
                        }
                        onClick={() => edit({ theme: t.id })}
                      >
                        <span style={{ background: t.swatch }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <hr />
                  <h3>{t("ed.layout")}</h3>
                  <div className="layout-picker">
                    {layouts.map((l) => (
                      <button
                        key={l.id}
                        className={
                          (issue.layout ?? "classic") === l.id ? "active" : ""
                        }
                        aria-pressed={(issue.layout ?? "classic") === l.id}
                        onClick={() => edit({ layout: l.id })}
                      >
                        <strong>{l.name}</strong>
                        <small>{l.hint}</small>
                      </button>
                    ))}
                  </div>
                  <hr />
                  <h3>{t("ed.status")}</h3>
                  <Choice
                    value={issue.status}
                    onChange={(status) => edit({ status })}
                    items={["Draft", "Ready"]}
                    label={(v) => t(("st." + v) as Key)}
                  />
                </aside>
              </div>
            </>
          )}
          {issue && !path.includes("/editor") && !path.includes("/read") && (
            <>
              <div className="page-heading">
                <div>
                  <button className="back" onClick={() => go("/newsletters")}>
                    ← All newsletters
                  </button>
                  <h1>{issue.title}</h1>
                  <p>
                    {issue.category} · {issue.issue} · Private
                  </p>
                </div>
                <div className="row">
                  <button
                    className="secondary"
                    onClick={() => duplicate(issue)}
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    className="secondary"
                    onClick={() => go("/newsletters/" + issue.id + "/read")}
                  >
                    <BookOpen size={16} />
                    Read full issue
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setSendList([]);
                      setSendDraft("");
                      setSendResult(null);
                      setModal("send");
                    }}
                  >
                    <Send size={16} />
                    Send now
                  </button>
                  <button
                    className="primary"
                    onClick={() => go("/newsletters/" + issue.id + "/editor")}
                  >
                    <Pencil size={16} />{t("nl.edit")}</button>
                </div>
              </div>
              <Tabs defaultValue="preview">
                <TabsList>
                  {[
                    "preview",
                    "recipients",
                    "performance",
                    "versions",
                  ].map((t) => (
                    <TabsTrigger key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="preview">
                  <div className="detail-layout">
                    <div>
                      <Tabs defaultValue="web">
                        <TabsList>
                          <TabsTrigger value="web">Web</TabsTrigger>
                          <TabsTrigger value="email">Email</TabsTrigger>
                          <TabsTrigger value="mobile">
                            Mobile notification
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="web">
                          {renderDocument(issue)}
                        </TabsContent>
                        <TabsContent value="email">
                          <iframe
                            title={t("ed.previewFrame")}
                            sandbox=""
                            className="email-frame"
                            srcDoc={renderEmail(issue, data.brand, origin)}
                          />
                        </TabsContent>
                        <TabsContent value="mobile">
                          <div className="panel mobile-preview">
                            <Smartphone />
                            <h3>{issue.title}</h3>
                            <p>
                              {issue.blocks
                                .find((b) => b.type === "Introduction")
                                ?.text.slice(0, 120)}
                            </p>
                            <small>
                              Newsletter link will be added when publication is
                              enabled.
                            </small>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    <aside className="panel">
                      <span className={"badge " + issue.status.toLowerCase()}>
                        {issue.status}
                      </span>
                      <h3>{t("nl.nextChapter")}</h3>
                      <p>
                        Add addresses or notify subscribed phones, and send it
                        straight away.
                      </p>
                      <button
                        className="primary"
                        onClick={() => {
                          setSendList([]);
                          setSendDraft("");
                          setSendResult(null);
                          setModal("send");
                        }}
                      >
                        <Send size={16} />
                        Send this issue
                      </button>
                      <hr />
                      <h3>{t("nl.publication")}</h3>
                      <p>
                        This issue is private. Public publication requires a
                        configured access policy.
                      </p>
                      <h3>{t("nl.lastUpdated")}</h3>
                      <p>{fmtDateTime(issue.updated)}</p>
                    </aside>
                  </div>
                </TabsContent>
                <TabsContent value="recipients">
                  <div className="panel">
                    <h3>{t("nl.snapshots")}</h3>
                    {data.campaigns
                      .filter((c) => c.issueId === issue.id)
                      .map((c) => (
                        <div key={c.id}>
                          <h3>{c.title}</h3>
                          {c.recipients.map((r) => (
                            <p key={r.id}>
                              {r.name} · {r.email} · Not dispatched (demo)
                            </p>
                          ))}
                        </div>
                      ))}
                    <p>{t("nl.snapshotsEmpty")}</p>
                  </div>
                </TabsContent>
                <TabsContent value="performance">
                  <div className="empty panel">
                    <ChartNoAxesCombined />
                    <h3>{t("nl.noData")}</h3>
                    <p>
                      Opens are approximate. Delivery does not prove inbox
                      placement or reading.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="versions">
                  <div className="panel">
                    <h3>{t("nl.campaignSnaps")}</h3>
                    {data.campaigns
                      .filter((c) => c.issueId === issue.id)
                      .map((c) => (
                        <div key={c.id}>
                          <p>
                            {c.date} · {c.snapshot.title}
                          </p>
                          {renderDocument(c.snapshot)}
                        </div>
                      ))}
                    <p>
                      Campaign content is copied at confirmation and remains
                      separate from edits.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
          {path === "/quick" && (
            <QuickSend
              brand={data.brand}
              issues={data.issues}
              contacts={data.contacts}
              origin={origin}
            />
          )}
          {path === "/contacts" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{t("ct.eyebrow")}</div>
                  <h1>{t("ct.title")}</h1>
                  <p>
                    {data.contacts.length} contacts ·{" "}
                    {data.contacts.filter((c) => c.subscribed).length}{" "}
                    subscribed to email
                  </p>
                </div>
                <div className="row">
                  <button
                    className="secondary"
                    onClick={() => setModal("import")}
                  >
                    <Upload size={16} />{t("ct.importCsv")}</button>
                  <button
                    className="primary"
                    onClick={() => setModal("contact")}
                  >
                    <Plus size={16} />{t("ct.add")}</button>
                </div>
              </div>
              <div className="group-bar">
                <button
                  className={groupFilter === "" ? "active" : ""}
                  onClick={() => setGroupFilter("")}
                >
                  Everyone <span>{data.contacts.length}</span>
                </button>
                {groups.map((g) => (
                  <button
                    key={g}
                    className={groupFilter === g ? "active" : ""}
                    onClick={() => setGroupFilter(groupFilter === g ? "" : g)}
                  >
                    {g} <span>{inGroup(g).length}</span>
                  </button>
                ))}
                <button
                  className="group-new"
                  onClick={() => {
                    const name = window.prompt("Name the new group")?.trim();
                    if (!name) return;
                    if (groups.includes(name)) {
                      setGroupFilter(name);
                      return;
                    }
                    // A group exists once someone is in it.
                    setNewGroup(name);
                    toast.success(
                      `“${name}” is ready — put someone in it using the Group column.`,
                    );
                  }}
                >
                  <Plus size={14} />
                  New group
                </button>
              </div>
              <div className="panel">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Contact", "Email", "Group", "Email subscription"].map(
                        (t) => (
                          <TableHead key={t}>{t}</TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.contacts
                      .filter((c) => !groupFilter || c.group === groupFilter)
                      .map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <span className="contact-name">
                            <span className="avatar">
                              {c.name.slice(0, 2).toUpperCase()}
                            </span>
                            {c.name}
                          </span>
                        </TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>
                          <select
                            className="cell-select"
                            value={c.group}
                            onChange={(e) => {
                              if (e.target.value === "__new") {
                                const name = window
                                  .prompt("Move to which group?", c.group)
                                  ?.trim();
                                if (name) updateContact(c.id, { group: name });
                                return;
                              }
                              updateContact(c.id, { group: e.target.value });
                            }}
                          >
                            {[...new Set([...groups, c.group, newGroup])]
                              .filter(Boolean)
                              .sort()
                              .map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            <option value="__new">{t("ct.newGroup")}</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <button
                            className={
                              "badge toggle " +
                              (c.subscribed ? "ready" : "draft")
                            }
                            title={t("ct.clickChange")}
                            onClick={() =>
                              updateContact(c.id, { subscribed: !c.subscribed })
                            }
                          >
                            {c.subscribed ? "Subscribed" : "Not subscribed"}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="footnote">
                Click a subscription to change it. Only subscribed people
                receive email — importing someone does not grant consent on
                their behalf.
              </p>
            </>
          )}
          {path === "/automations" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A RHYTHM THAT WORKS FOR YOU</div>
                  <h1>{t("ct.sub")}</h1>
                  <p>
                    Pick a newsletter, a channel and how often. It goes out on
                    its own from then on.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => setModal("automation")}
                >
                  <Plus size={16} />
                  New automation
                </button>
              </div>

              <div className="panel">
                {data.automations.length ? (
                  data.automations.map((a) => {
                    const issue = data.issues.find((i) => i.id === a.issueId);
                    return (
                      <div className="record auto-row" key={a.id}>
                        <Workflow size={22} />
                        <span>
                          {a.name}
                          <small>
                            {a.frequency} · {a.channel ?? "Email"} ·{" "}
                            {issue ? issue.title : "Most recent newsletter"}
                            {a.channel === "Phone alert"
                              ? ""
                              : a.recipients?.length
                                ? ` · ${a.recipients.length} chosen ${a.recipients.length === 1 ? "person" : "people"}`
                                : a.group
                                  ? ` · ${a.group}`
                                  : ""}
                          </small>
                          <small className="auto-when">
                            {a.paused
                              ? "Paused"
                              : a.nextRun
                                ? `Next send ${fmtDateTime(a.nextRun)}`
                                : "Next send at the next daily run"}
                            {a.lastResult
                              ? ` · Last run: ${a.lastResult}`
                              : ""}
                          </small>
                        </span>
                        <span
                          className={"badge " + (a.paused ? "draft" : "ready")}
                        >
                          {a.paused ? "Paused" : "On"}
                        </span>
                        <Switch
                          checked={!a.paused}
                          aria-label={"Turn " + a.name + (a.paused ? " on" : " off")}
                          onCheckedChange={(v) => {
                            save({
                              ...data,
                              automations: data.automations.map((x) =>
                                x.id === a.id ? { ...x, paused: !v } : x,
                              ),
                            });
                            toast.success(
                              v ? "Automation is on" : "Automation paused",
                            );
                          }}
                        />
                        <button
                          className="auto-remove"
                          aria-label={"Delete " + a.name}
                          onClick={() => {
                            save({
                              ...data,
                              automations: data.automations.filter(
                                (x) => x.id !== a.id,
                              ),
                            });
                            toast.success(t("au.removed"));
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">
                    <Workflow />
                    <h2>{t("au.empty")}</h2>
                    <p>
                      Choose a newsletter, a channel and how often. The studio
                      sends it on schedule from then on.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setModal("automation")}
                    >
                      <Plus size={16} />{t("au.first")}</button>
                  </div>
                )}
              </div>

              <p className="footnote">
                Scheduled sends run once a day at 09:00 UTC. They use the same
                delivery as the Send panel, so whatever works there works here.
              </p>
            </>
          )}
          <footer className="main-footer">
            <span>
              <Activity size={13} /> {t("foot.pulse")}
            </span>
            <span>
              {data.brand} · {t("foot.demo")}
            </span>
          </footer>
        </main>
      </div>
      <Dialog open={!!modal} onOpenChange={(v) => !v && setModal("")}>
        <DialogContent className={modal === "create" ? "wide-modal" : ""}>
          <DialogTitle>
            {modal ? t(("dlg." + modal) as Key) : ""}
          </DialogTitle>
          <DialogDescription>
            {modal === "send"
              ? t("dlg.sendSub")
              : modal === "create"
                ? t("dlg.createSub")
                : modal === "automation"
                  ? t("dlg.automationSub")
                  : t("dlg.default")}
          </DialogDescription>
          {modal === "create" && (
            <Tabs defaultValue="ai">
              <TabsList>
                <TabsTrigger value="ai">
                  <Sparkles size={15} />
                  Write with AI
                </TabsTrigger>
                <TabsTrigger value="template">
                  <FileText size={15} />
                  Make your own
                </TabsTrigger>
              </TabsList>
              <TabsContent value="template">
                <div className="template-grid">
                  {templates.map((t, i) => (
                    <button
                      key={t}
                      className={"template cover-" + i}
                      onClick={() => create(t)}
                    >
                      <FileText size={25} />
                      <strong>{t}</strong>
                      <span>
                        Start with this template <ArrowRight size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="ai-grid">
                  <section className="ai-step">
                    <span className="ai-step-no">1</span>
                    <h3>{t("md.startDraft")}</h3>
                    <p>
                      Describe the theme — that is all. Your assistant opens
                      with the prompt ready and writes the whole issue, photos
                      included.
                    </p>
                    <label className="ai-field">
                      What is the theme of this issue?
                      <input
                        value={aiTopic}
                        placeholder="e.g. autumn coffee recipes for our café"
                        onChange={(e) => setAiTopic(e.target.value)}
                      />
                    </label>
                    <div className="ai-launch">
                      <a
                        className="primary"
                        href={chatUrl("chatgpt", buildPrompt(aiTopic))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Sparkles size={16} />
                        Open ChatGPT
                      </a>
                      <a
                        className="primary"
                        href={chatUrl("claude", buildPrompt(aiTopic))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Sparkles size={16} />
                        Open Claude
                      </a>
                    </div>
                    <label className="ai-field">
                      Pick a look
                      <div className="theme-picker">
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            title={t.name}
                            className={aiTheme === t.id ? "active" : ""}
                            onClick={() => setAiTheme(t.id)}
                          >
                            <span style={{ background: t.swatch }} />
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </label>
                    <label className="ai-field">
                      Pick a layout
                      <div className="layout-picker">
                        {layouts.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            className={aiLayout === l.id ? "active" : ""}
                            aria-pressed={aiLayout === l.id}
                            onClick={() => setAiLayout(l.id)}
                          >
                            <strong>{l.name}</strong>
                            <small>{l.hint}</small>
                          </button>
                        ))}
                      </div>
                    </label>
                    <button
                      className="ai-copy"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(buildPrompt(aiTopic))
                          .then(() => toast.success(t("md.promptCopied")))
                          .catch(() => toast.error("Couldn't copy the prompt"));
                      }}
                    >
                      <Copy size={14} />
                      Or copy the prompt
                    </button>
                  </section>
                  <section className="ai-step">
                    <span className="ai-step-no">2</span>
                    <h3>{t("md.pasteReply")}</h3>
                    <p>
                      Copy what the assistant wrote and drop it in. We&rsquo;ll
                      turn it into blocks you can edit.
                    </p>
                    <textarea
                      className="ai-paste"
                      value={aiDraft}
                      placeholder={
                        "TITLE: A little pulse. A lot of possibility.\nINTRO: Here is what we have been working on…\nSTORY: …"
                      }
                      onChange={(e) => setAiDraft(e.target.value)}
                    />
                    {!!aiPreview.blocks.length && (
                      <p className="ai-count">
                        Found {aiPreview.blocks.length} block
                        {aiPreview.blocks.length === 1 ? "" : "s"}
                        {aiPreview.title ? ` · “${aiPreview.title}”` : ""}
                      </p>
                    )}
                    <div className="ai-launch">
                      <button
                        className="primary"
                        disabled={!aiPreview.blocks.length || importing}
                        onClick={async () => {
                          setImporting(true);
                          // Photo lookup is a network call, so it happens here
                          // rather than during the live preview.
                          const draft = await resolvePhotos(aiPreview);
                          const n = {
                            id: uid(),
                            title: draft.title || "Untitled newsletter",
                            category: templates[0],
                            status: "Draft",
                            updated: new Date().toISOString(),
                            issue:
                              "ISSUE 00" +
                              Math.min(9, data.issues.length + 1),
                            public: false as const,
                            theme: aiTheme,
                            layout: aiLayout,
                            blocks: draft.blocks,
                          };
                          await save({ ...data, issues: [n, ...data.issues] });
                          const missing = draft.blocks.filter(
                            (b) => b.type === "Image" && !b.src,
                          ).length;
                          setImporting(false);
                          setAiDraft("");
                          setModal("");
                          toast.success(
                            missing
                              ? `Imported — add ${missing} photo${missing > 1 ? "s" : ""} yourself`
                              : "Imported — ready to edit",
                          );
                          go("/newsletters/" + n.id + "/editor");
                        }}
                      >
                        <ArrowRight size={16} />
                        {importing ? "Finding photos…" : "Import as newsletter"}
                      </button>
                      {!!aiDraft && (
                        <button onClick={() => setAiDraft("")}>{t("md.clear")}</button>
                      )}
                    </div>
                  </section>
                </div>
                {!!aiPreview.blocks.length && (
                  <div className="ai-preview">
                    <h3>{t("ct.whatImported")}</h3>
                    <ul>
                      {aiPreview.blocks.map((b) => (
                        <li key={b.id}>
                          <span className="ai-chip">{b.type}</span>
                          {b.type === "Image" && !b.src
                            ? "photo of “" + b.text + "”"
                            : b.src || b.text.slice(0, 80) || "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          {modal === "send" && issue && (
            <div className="send-box">
              <div className="send-channel">
                {(["Email", "Push", "SMS"] as const).map((c) => (
                  <button
                    key={c}
                    className={sendChannel === c ? "active" : ""}
                    onClick={() => {
                      setSendChannel(c);
                      setSendList([]);
                      setSendResult(null);
                    }}
                  >
                    {c === "Email" ? (
                      <Send size={15} />
                    ) : c === "Push" ? (
                      <Bell size={15} />
                    ) : (
                      <Smartphone size={15} />
                    )}
                    {c === "Email"
                      ? "Email"
                      : c === "Push"
                        ? "Phone alert"
                        : "Text"}
                  </button>
                ))}
              </div>

              {sendChannel !== "Push" && (
                <>
              <div className="chips-field">
                <span className="chips-label">
                  {sendChannel === "Email" ? "Send to" : "Text to"}
                </span>
                <div
                  className="chips"
                  onClick={() =>
                    (
                      document.getElementById("chip-entry") as HTMLInputElement
                    )?.focus()
                  }
                >
                  {sendList.map((r) => (
                    <span key={r} className="chip">
                      {r}
                      <button
                        aria-label={"Remove " + r}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSendList((list) => list.filter((x) => x !== r));
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    id="chip-entry"
                    value={sendDraft}
                    placeholder={
                      sendList.length
                        ? "Add another…"
                        : sendChannel === "Email"
                          ? "alex@example.com"
                          : "+15551234567"
                    }
                    onChange={(e) => {
                      // A pasted list turns into chips straight away.
                      if (/[\s,;]/.test(e.target.value)) addRecipients(e.target.value);
                      else setSendDraft(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (!sendDraft.trim()) return;
                        e.preventDefault();
                        addRecipients(sendDraft);
                      }
                      if (e.key === "Backspace" && !sendDraft && sendList.length)
                        setSendList((list) => list.slice(0, -1));
                    }}
                    onBlur={() => sendDraft.trim() && addRecipients(sendDraft)}
                  />
                </div>
              </div>

              <div className="send-quick">
                <button
                  onClick={() => {
                    const list = reachable();
                    if (!list.length) {
                      toast.error(t("md.noSubscribed"));
                      return;
                    }
                    addRecipients(list.join(","));
                  }}
                >
                  <Users size={14} />
                  Everyone ({reachable().length})
                </button>
                {groups.map((g) => {
                  const list = reachable(g);
                  if (!list.length) return null;
                  return (
                    <button
                      key={g}
                      onClick={() => addRecipients(list.join(","))}
                    >
                      <Users size={14} />
                      {g} ({list.length})
                    </button>
                  );
                })}
                {!!sendList.length && (
                  <button onClick={() => setSendList([])}>{t("md.clearAll")}</button>
                )}
              </div>
                </>
              )}

              {sendChannel === "Push" ? (
                <div className="sms-preview">
                  <span className="sms-label">{t("md.everyPhone")}</span>
                  <p className="sms-bubble">
                    <strong>{issue.title}</strong>
                    <br />
                    {issue.blocks
                      .find((b) => b.type === "Introduction")
                      ?.text.slice(0, 90) || "Tap to read the new issue."}
                  </p>
                  <p className="sms-meta">
                    {pushCount === null
                      ? "Counting subscribed devices…"
                      : pushCount === 0
                        ? "No one has turned on notifications yet. Share the full issue link — readers tap “Notify me” at the bottom."
                        : `${pushCount} device${pushCount === 1 ? "" : "s"} subscribed · free to send`}
                  </p>
                </div>
              ) : sendChannel === "Email" ? (
                <p className="send-what">
                  Each person gets the short version — cover photo, intro and
                  key points — with a button to the full issue.
                </p>
              ) : (
                (() => {
                  const text = renderSms(issue, data.brand, origin);
                  const parts = smsSegments(text);
                  return (
                    <div className="sms-preview">
                      <span className="sms-label">{t("md.theyReceive")}</span>
                      <p className="sms-bubble">{text}</p>
                      <p className="send-what">
                        Texts need a paid messaging account. If yours is still
                        on a trial, this will be refused — <strong>Phone
                        alert</strong> reaches the same phone for free.
                      </p>
                      <p className="sms-meta">
                        {text.length} of {smsLimit(text)} characters ·{" "}
                        {parts === 1
                          ? "one message"
                          : `${parts} messages (charged as ${parts})`}
                        {needsUnicodeSms(text)
                          ? " · non-Latin text, so the limit is 70"
                          : ""}
                        {parts > 1 ? " · shorten the title to fit one" : ""}
                      </p>
                    </div>
                  );
                })()
              )}

              <div className="ai-launch">
                <button
                  className="primary"
                  disabled={
                    sending ||
                    (sendChannel === "Push" ? !pushCount : !sendList.length)
                  }
                  onClick={async () => {
                    setSending(true);
                    setSendResult(null);
                    if (sendChannel === "Push") {
                      try {
                        const res = await fetch("/api/push/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: issue.title,
                            body:
                              issue.blocks
                                .find((b) => b.type === "Introduction")
                                ?.text.slice(0, 120) ??
                              "Tap to read the new issue.",
                            url: readUrl(issue, origin),
                          }),
                        });
                        const body = (await res.json()) as {
                          error?: string;
                          sent?: number;
                          failed?: number;
                        };
                        if (!res.ok)
                          setSendResult(body.error ?? "Unable to send.");
                        else {
                          setSendResult(
                            `Notified ${body.sent} device${body.sent === 1 ? "" : "s"}.` +
                              (body.failed ? ` ${body.failed} failed.` : ""),
                          );
                          if (body.sent) toast.success(t("md.notified"));
                        }
                      } catch {
                        setSendResult("Could not reach the server.");
                      } finally {
                        setSending(false);
                      }
                      return;
                    }
                    try {
                      const res = await fetch("/api/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          channel: sendChannel,
                          to: sendList,
                          subject: issue.title,
                          html:
                            sendChannel === "Email"
                              ? renderEmail(issue, data.brand, origin)
                              : undefined,
                          text:
                            sendChannel === "SMS"
                              ? renderSms(issue, data.brand, origin)
                              : undefined,
                        }),
                      });
                      const body = (await res.json()) as {
                        error?: string;
                        sent?: number;
                        failed?: number;
                        results?: { ok: boolean; error?: string }[];
                      };
                      if (!res.ok) {
                        setSendResult(body.error ?? "Unable to send right now.");
                      } else if (body.failed) {
                        // Show why it failed, not just that it did.
                        const reason = body.results?.find((r) => !r.ok)?.error;
                        setSendResult(
                          `Sent to ${body.sent} of ${sendList.length}.` +
                            (reason ? ` ${reason}` : ""),
                        );
                        if (body.sent) {
                          toast.success("Sent");
                          setSendList([]);
                        }
                      } else {
                        setSendResult(`Sent to ${body.sent} of ${sendList.length}.`);
                        toast.success("Sent");
                        setSendList([]);
                      }
                    } catch {
                      setSendResult("Could not reach the server.");
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  <Send size={16} />
                  {sending
                    ? "Sending…"
                    : sendChannel === "Push"
                      ? pushCount
                        ? `Notify ${pushCount} device${pushCount === 1 ? "" : "s"}`
                        : "No devices yet"
                      : sendList.length === 1
                        ? "Send to 1 person"
                        : sendList.length
                          ? `Send to ${sendList.length} people`
                          : "Add someone first"}
                </button>
                <button onClick={() => setModal("")}>{t("md.cancel")}</button>
              </div>
              {sendResult && <p className="send-result">{sendResult}</p>}
            </div>
          )}
          {modal === "notifications" && (
            <p>
              No delivery alerts. Complete provider setup to receive campaign
              notifications.
            </p>
          )}
          {modal === "setup" && (
            <div>
              <p>
                Configure a verified email sender, an email API key, and a
                webhook signing secret on the server. SMS requires a sender
                number and a messaging provider account.
              </p>
              <p>
                This preview does not include live provider dispatch or a
                durable scheduling worker. Campaigns are demo drafts.
              </p>
            </div>
          )}
          {modal === "contact" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  email = String(f.get("email")).trim().toLowerCase();
                if (data.contacts.some((c) => c.email === email)) {
                  toast.error(t("ct.dupe"));
                  return;
                }
                save({
                  ...data,
                  contacts: [
                    ...data.contacts,
                    {
                      id: uid(),
                      name: String(f.get("name")),
                      email,
                      phone: String(f.get("phone")),
                      group: String(f.get("group")),
                      subscribed: false,
                    },
                  ],
                });
                setModal("");
                toast.success(t("ct.noConsent"));
              }}
            >
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Phone (international format)
                <input
                  name="phone"
                  pattern="\+[1-9][0-9]{6,14}"
                  placeholder="+12025550123"
                />
              </label>
              <label>{t("ct.group")}<input name="group" defaultValue="Community" />
              </label>
              <p>{t("ct.consent")}</p>
              <button className="primary">{t("ct.add")}</button>
            </form>
          )}
          {modal === "import" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = String(new FormData(e.currentTarget).get("csv"));
                let rows: string[][];
                try {
                  rows = parseCSV(text);
                } catch {
                  toast.error(t("ct.badCsv"));
                  return;
                }
                const headers = rows.shift()?.map((x) => x.toLowerCase()) || [];
                if (!headers.includes("name") || !headers.includes("email")) {
                  toast.error(t("ct.csvHeaders"));
                  return;
                }
                const lines = rows;
                let skipped = 0;
                const contacts = [...data.contacts];
                for (const line of lines) {
                  const name = line[headers.indexOf("name")],
                    email = line[headers.indexOf("email")],
                    group = line[headers.indexOf("group")];
                  if (
                    !name ||
                    !email ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                    contacts.some(
                      (c) => c.email.toLowerCase() === email.toLowerCase(),
                    )
                  ) {
                    skipped++;
                    continue;
                  }
                  contacts.push({
                    id: uid(),
                    name,
                    email: email.toLowerCase(),
                    group: group || "Imported",
                    phone: "",
                    subscribed: csvConsent,
                  });
                }
                save({ ...data, contacts });
                setModal("");
                setCsvText("");
                setCsvName("");
                setCsvConsent(false);
                toast.success(
                  `${contacts.length - data.contacts.length} imported; ${skipped} invalid or duplicate rows skipped`,
                );
              }}
            >
              <p>
                Choose a CSV file, or paste the rows below. It needs
                <strong> name</strong> and <strong>email</strong> columns, and
                may include a <strong>group</strong> column.
              </p>

              <label className="csv-drop">
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCsvText(await file.text());
                    setCsvName(file.name);
                    e.target.value = "";
                  }}
                />
                <Upload size={20} />
                <span>{csvName ? csvName + " loaded" : "Choose a CSV file"}</span>
                <small>or paste the rows below</small>
              </label>

              <textarea
                name="csv"
                required
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setCsvName("");
                }}
                placeholder={"name,email,group"}
              />

              <label className="csv-consent">
                <input
                  type="checkbox"
                  checked={csvConsent}
                  onChange={(e) => setCsvConsent(e.target.checked)}
                />
                <span>
                  These people agreed to receive this newsletter.
                  <small>
                    Tick only if true. Left unticked, they are imported as not
                    subscribed and will not be emailed.
                  </small>
                </span>
              </label>

              <button className="primary">{t("ct.import")}</button>
            </form>
          )}
          {modal === "automation" && (
            <AutomationForm
              issues={data.issues}
              contacts={data.contacts}
              groups={groups}
              onCreate={(a) => {
                /* First run is tomorrow at 09:00 UTC, so creating one never
                   fires a send in the same moment. */
                const first = new Date();
                first.setUTCDate(first.getUTCDate() + 1);
                first.setUTCHours(9, 0, 0, 0);
                save({
                  ...data,
                  automations: [
                    ...data.automations,
                    {
                      id: uid(),
                      ...a,
                      paused: false,
                      nextRun: first.toISOString(),
                    },
                  ],
                });
                setModal("");
                toast.success(
                  "Automation is on — first send " +
                    fmtDate(first.toISOString()),
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster
        theme={light ? "light" : "dark"}
        position="bottom-right"
        richColors
      />
    </SidebarProvider>
  );
}
