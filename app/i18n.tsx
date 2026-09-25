"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* English and Korean.

   The dictionary is one object rather than a file per language, so a missing
   translation is visible while editing instead of at runtime: every key names
   both wordings side by side. Korean is written the way the interface speaks
   — plain 해요체 for instructions, nouns for labels — rather than transliterated
   English.

   Interpolation is {name}, filled from the second argument. */

export type Lang = "en" | "ko";

const dict = {
  /* ---- chrome ---- */
  "nav.workspace": { en: "WORKSPACE", ko: "워크스페이스" },
  "nav.dashboard": { en: "Dashboard", ko: "대시보드" },
  "nav.newsletters": { en: "Newsletters", ko: "뉴스레터" },
  "nav.quick": { en: "Quick send", ko: "빠른 발송" },
  "nav.contacts": { en: "Contacts & Groups", ko: "연락처 및 그룹" },
  "nav.editor": { en: "Newsletter editor", ko: "뉴스레터 편집기" },
  "title.issue": { en: "Newsletter details", ko: "뉴스레터 상세" },
  "title.campaign": { en: "Campaign details", ko: "캠페인 상세" },

  "side.title": {
    en: "Your next great issue starts with an idea.",
    ko: "좋은 뉴스레터는 하나의 아이디어에서 시작됩니다.",
  },
  "side.sub": { en: "Make it yours with a template.", ko: "템플릿으로 시작해 보세요." },
  "side.cta": { en: "Explore templates", ko: "템플릿 둘러보기" },

  "profile.workspace": { en: "Demo workspace", ko: "데모 워크스페이스" },
  "profile.access": { en: "Preview access", ko: "미리보기 권한" },
  "action.signOut": { en: "Sign out", ko: "로그아웃" },
  "action.theme": { en: "Toggle theme", ko: "테마 전환" },
  "action.language": { en: "Change language", ko: "언어 변경" },
  "action.notifications": { en: "Notifications", ko: "알림" },
  "top.search": { en: "Search newsletters…", ko: "뉴스레터 검색…" },
  "top.crumb": { en: "Workspace", ko: "워크스페이스" },
  "banner.demo": { en: "Demo workspace", ko: "데모 워크스페이스" },
  "banner.demoNote": {
    en: "— sample content, no real messages sent",
    ko: "— 샘플 콘텐츠이며 실제로 발송되지 않습니다",
  },

  /* ---- quick send ---- */
  "qs.eyebrow": { en: "Quick send", ko: "빠른 발송" },
  "qs.title": {
    en: "Send a picture as the whole newsletter.",
    ko: "사진 한 장을 그대로 뉴스레터로 보내세요.",
  },
  "qs.lede": {
    en: "Drop in a poster, a flyer, a scanned page — or a finished HTML file — and send it as it is. Tapping the picture can open the full issue, or it can simply be a picture.",
    ko: "포스터나 전단, 스캔한 문서, 또는 완성된 HTML 파일을 올려 그대로 보낼 수 있습니다. 사진을 누르면 전체 호가 열리게 하거나, 그냥 사진으로만 둘 수도 있습니다.",
  },
  "qs.drop": { en: "Drop a picture here", ko: "여기에 사진을 놓으세요" },
  "qs.reading": { en: "Reading your file…", ko: "파일을 읽는 중…" },
  "qs.dropSub": {
    en: "or choose a file — JPEG, PNG, GIF, WebP, or .html",
    ko: "또는 파일 선택 — JPEG, PNG, GIF, WebP, .html",
  },
  "qs.chooseFile": { en: "choose a file", ko: "파일 선택" },
  "qs.remove": { en: "Remove", ko: "제거" },
  "qs.tapOpens": { en: "opens the full issue", ko: "전체 호가 열립니다" },
  "qs.capHtml": { en: "Sent exactly as written.", ko: "작성된 그대로 발송됩니다." },
  "qs.capLinked": {
    en: "Recipients tap the picture to read the rest.",
    ko: "받는 사람이 사진을 누르면 나머지를 읽을 수 있습니다.",
  },
  "qs.capPlain": {
    en: "Just the picture — nothing to tap.",
    ko: "사진만 — 누를 곳이 없습니다.",
  },
  "qs.subject": { en: "Subject", ko: "제목" },
  "qs.onTap": { en: "When someone taps the picture", ko: "사진을 눌렀을 때" },
  "qs.tapNothing": {
    en: "Nothing — just the picture",
    ko: "아무 동작 없음 — 사진만",
  },
  "qs.tapOpen": { en: "Opens “{title}”", ko: "“{title}” 열기" },
  "qs.copyLink": { en: "Copy link", ko: "링크 복사" },
  "qs.copied": { en: "Link copied", ko: "링크를 복사했습니다" },
  "qs.copyFailed": {
    en: "Your browser would not let us copy.",
    ko: "브라우저가 복사를 허용하지 않았습니다.",
  },
  "qs.caption": { en: "A line under the picture", ko: "사진 아래 문구" },
  "qs.optional": { en: "optional", ko: "선택" },
  "qs.captionHint": {
    en: "Say what this is, if it needs saying.",
    ko: "설명이 필요하다면 적어 주세요.",
  },
  "qs.sendTo": { en: "Send to", ko: "받는 사람" },
  "qs.everyone": { en: "Everyone", ko: "전체" },
  "qs.addressHint": {
    en: "Press space, comma or Enter after each address.",
    ko: "주소를 입력한 뒤 스페이스, 쉼표 또는 Enter를 누르세요.",
  },
  "qs.firstAddress": { en: "name@example.com", ko: "name@example.com" },
  "qs.another": { en: "Add another…", ko: "더 추가…" },
  "qs.send": { en: "Send", ko: "보내기" },
  "qs.sendOne": { en: "Send to 1 person", ko: "1명에게 보내기" },
  "qs.sendMany": { en: "Send to {n} people", ko: "{n}명에게 보내기" },
  "qs.sending": { en: "Sending…", ko: "보내는 중…" },
  "qs.needFile": {
    en: "Add a picture or an HTML file to send.",
    ko: "보낼 사진이나 HTML 파일을 추가하세요.",
  },
  "qs.removeAddress": { en: "Remove {address}", ko: "{address} 제거" },

  /* ---- quick send: what came back ---- */
  "qs.okOne": { en: "Sent to 1 person.", ko: "1명에게 보냈습니다." },
  "qs.okMany": { en: "Sent to {n} people.", ko: "{n}명에게 보냈습니다." },
  "qs.partial": {
    en: "Sent to {sent} of {total}.",
    ko: "{total}명 중 {sent}명에게 보냈습니다.",
  },
  "qs.failed": {
    en: "Unable to send right now.",
    ko: "지금은 보낼 수 없습니다.",
  },
  "qs.network": {
    en: "Network error — nothing was sent.",
    ko: "네트워크 오류 — 아무것도 보내지 않았습니다.",
  },
  "qs.onItsWay": { en: "On its way", ko: "발송했습니다" },
  "qs.readyImage": { en: "Picture ready to send", ko: "사진을 보낼 준비가 됐습니다" },
  "qs.readyHtml": { en: "HTML ready to send", ko: "HTML을 보낼 준비가 됐습니다" },
  "qs.emptyFile": { en: "That file is empty.", ko: "빈 파일입니다." },
  "qs.unreadable": {
    en: "That file could not be read.",
    ko: "파일을 읽을 수 없습니다.",
  },
  "qs.wrongType": {
    en: "Choose a picture (JPEG, PNG, GIF, WebP…) or an .html file.",
    ko: "사진(JPEG, PNG, GIF, WebP…) 또는 .html 파일을 선택하세요.",
  },
  "qs.badImage": {
    en: "That picture didn't load.",
    ko: "사진을 불러오지 못했습니다.",
  },
  "qs.badAddress": {
    en: "{address} is not a valid email address.",
    ko: "{address}는 올바른 이메일 주소가 아닙니다.",
  },
  "qs.badAddresses": {
    en: "{n} entries are not valid email addresses.",
    ko: "{n}개 항목이 올바른 이메일 주소가 아닙니다.",
  },
} satisfies Record<string, Record<Lang, string>>;

export type Key = keyof typeof dict;

const STORAGE = "mllab-lang";

/** The language to open in: what was chosen before, else the browser's. */
export function firstLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved === "en" || saved === "ko") return saved;
  } catch {
    // private window; fall through to the browser's own setting
  }
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export type Translate = (key: Key, vars?: Record<string, string | number>) => string;

/* Standalone, for the component that mounts the provider: it renders the
   provider rather than sitting under one, so the hook would hand it the
   default rather than the chosen language. */
export function translator(lang: Lang): Translate {
  return (key, vars) => {
    let out = dict[key]?.[lang] ?? dict[key]?.en ?? String(key);
    if (vars)
      for (const [name, value] of Object.entries(vars))
        out = out.replaceAll(`{${name}}`, String(value));
    return out;
  };
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Translate }>({
  lang: "en",
  setLang: () => {},
  t: translator("en"),
});

export function LanguageProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: ReactNode;
}) {
  const t = useMemo(() => translator(lang), [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

/** Keeps the choice, and tells the page so the font stack can follow. */
export function useLangState() {
  const [lang, set] = useState<Lang>("en");
  const setLang = useCallback((next: Lang) => {
    set(next);
    try {
      localStorage.setItem(STORAGE, next);
    } catch {
      // nothing to do; the choice simply will not outlive the tab
    }
    document.documentElement.lang = next;
  }, []);
  return { lang, setLang, set };
}
