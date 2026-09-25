"use client";
import { Languages } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  /* ---- landing and sign-in ---- */
  "lp.eyebrow": { en: "CREATE. CONNECT. SHARE.", ko: "만들고. 잇고. 나눕니다." },
  "lp.headline1": { en: "Beautiful newsletters.", ko: "아름다운 뉴스레터." },
  "lp.headline2": { en: "Meaningful connections.", ko: "의미 있는 연결." },
  "lp.lede": {
    en: "Create your newsletter, shape your story, and prepare it for the channels your audience uses.",
    ko: "뉴스레터를 만들고, 이야기를 다듬고, 독자가 쓰는 채널에 맞게 준비하세요.",
  },
  "lp.pause": { en: "Pause animations", ko: "애니메이션 멈춤" },
  "lp.play": { en: "Play animations", ko: "애니메이션 재생" },
  "lp.welcome": { en: "Welcome back", ko: "다시 오신 것을 환영합니다" },
  "lp.signInTo": {
    en: "Sign in to the Machine Learning Lab workspace.",
    ko: "머신러닝 연구실 워크스페이스에 로그인하세요.",
  },
  "lp.username": { en: "Username", ko: "아이디" },
  "lp.usernameHint": { en: "Your username", ko: "아이디를 입력하세요" },
  "lp.password": { en: "Password", ko: "비밀번호" },
  "lp.passwordHint": { en: "Your password", ko: "비밀번호를 입력하세요" },
  "lp.showPassword": { en: "Show password", ko: "비밀번호 보기" },
  "lp.hidePassword": { en: "Hide password", ko: "비밀번호 숨기기" },
  "lp.signIn": { en: "Sign in", ko: "로그인" },
  "lp.signOut": { en: "Sign out", ko: "로그아웃" },
  "lp.foot": { en: "A little pulse goes a long way.", ko: "작은 신호가 먼 곳까지 닿습니다." },
  "lp.or": { en: "OR", ko: "또는" },
  "lp.google": { en: "Continue with Google", ko: "Google로 계속하기" },
  "lp.email": { en: "Email", ko: "이메일" },
  "lp.emailLink": { en: "Email me a sign-in link", ko: "로그인 링크 보내기" },
  "lp.noMatch": {
    en: "That username and password did not match. Please try again.",
    ko: "아이디 또는 비밀번호가 일치하지 않습니다. 다시 시도해 주세요.",
  },
  "lp.unreachable": {
    en: "Could not reach the server. Please try again.",
    ko: "서버에 연결하지 못했습니다. 다시 시도해 주세요.",
  },
  "lp.notConfigured": {
    en: "Sign-in is not configured on the server. Set AUTH_SECRET, then redeploy.",
    ko: "서버에 로그인이 설정되어 있지 않습니다. AUTH_SECRET을 설정한 뒤 다시 배포하세요.",
  },
  "lp.enterUsername": { en: "Enter your username.", ko: "아이디를 입력하세요." },
  "lp.enterPassword": { en: "Enter your password.", ko: "비밀번호를 입력하세요." },

  /* ---- channel preview ---- */
  "ch.heading": { en: "Channel preview", ko: "채널 미리보기" },
  "ch.note": {
    en: "A demonstration. Nothing is sent or published from this page.",
    ko: "시연용입니다. 이 페이지에서는 아무것도 발송되거나 게시되지 않습니다.",
  },
  "ch.channels": { en: "Channels", ko: "채널" },
  "ch.cap.available": { en: "Available", ko: "사용 가능" },
  "ch.cap.setup": { en: "Needs a provider", ko: "공급자 설정 필요" },
  "ch.cap.concept": { en: "Concept preview", ko: "컨셉 미리보기" },
  "ch.email.name": { en: "Email", ko: "이메일" },
  "ch.email.detail": {
    en: "Send the issue to your contacts. A short version carries the cover, the opening and the key points, with a button through to the full issue.",
    ko: "연락처로 이번 호를 보냅니다. 표지와 도입부, 핵심 내용만 담은 짧은 버전과 전체 호로 가는 버튼이 함께 전달됩니다.",
  },
  "ch.push.name": { en: "Phone alert", ko: "휴대폰 알림" },
  "ch.push.detail": {
    en: "Send a free notification to readers who asked for one. It arrives on their lock screen and opens the full issue.",
    ko: "알림을 신청한 독자에게 무료로 보냅니다. 잠금 화면에 도착하고, 누르면 전체 호가 열립니다.",
  },
  "ch.link.name": { en: "Share link", ko: "링크 공유" },
  "ch.link.detail": {
    en: "Every issue has a public page. Copy the link and put it anywhere you already talk to people.",
    ko: "모든 호에는 공개 페이지가 있습니다. 링크를 복사해 평소 사람들과 이야기하는 곳 어디에든 올리세요.",
  },
  "ch.sms.name": { en: "SMS", ko: "문자 메시지" },
  "ch.sms.detail": {
    en: "A short text with a link to the full issue. Ready in the app, but it needs a paid messaging account before anything can be sent.",
    ko: "전체 호 링크를 담은 짧은 문자입니다. 앱에는 준비되어 있지만, 발송하려면 유료 메시지 계정이 필요합니다.",
  },
  "ch.whatsapp.name": { en: "WhatsApp", ko: "WhatsApp" },
  "ch.whatsapp.detail": {
    en: "How a message carrying your newsletter link could look. There is no WhatsApp integration in the app yet.",
    ko: "뉴스레터 링크를 담은 메시지가 어떤 모습일지 보여 줍니다. 아직 WhatsApp 연동은 없습니다.",
  },
  "ch.telegram.name": { en: "Telegram", ko: "Telegram" },
  "ch.telegram.detail": {
    en: "How a channel post introducing your newsletter could look. Not connected to the app.",
    ko: "뉴스레터를 소개하는 채널 게시물이 어떤 모습일지 보여 줍니다. 앱과 연결되어 있지 않습니다.",
  },
  "ch.linkedin.name": { en: "LinkedIn", ko: "LinkedIn" },
  "ch.linkedin.detail": {
    en: "How a professional post introducing the issue could look. Not connected to the app.",
    ko: "이번 호를 소개하는 비즈니스 게시물이 어떤 모습일지 보여 줍니다. 앱과 연결되어 있지 않습니다.",
  },
  "ch.instagram.name": { en: "Instagram", ko: "Instagram" },
  "ch.instagram.detail": {
    en: "How a visual teaser for the issue could look. Not connected to the app.",
    ko: "이번 호의 시각적 예고가 어떤 모습일지 보여 줍니다. 앱과 연결되어 있지 않습니다.",
  },
  "ch.facebook.name": { en: "Facebook", ko: "Facebook" },
  "ch.facebook.detail": {
    en: "How a page post pointing at the issue could look. Not connected to the app.",
    ko: "이번 호로 안내하는 페이지 게시물이 어떤 모습일지 보여 줍니다. 앱과 연결되어 있지 않습니다.",
  },

  /* ---- studio: editor, dashboard, lists, contacts, modals ---- */
  "an.eyebrow": { en: "THE BIGGER PICTURE", ko: "전체 그림" },
  "an.firstChapter": { en: "Your first campaign is the first chapter.", ko: "첫 캠페인이 첫 장이 됩니다." },
  "an.noData": { en: "No live delivery data", ko: "실시간 발송 데이터가 없습니다" },
  "an.sub": { en: "Delivery and engagement, clearly separated.", ko: "발송과 반응을 나누어 보여 줍니다." },
  "an.title": { en: "Every send tells a story.", ko: "모든 발송에는 이야기가 있습니다." },
  "au.empty": { en: "Send it without thinking about it", ko: "신경 쓰지 않아도 알아서 발송됩니다" },
  "au.first": { en: "Create your first automation", ko: "첫 자동 발송 만들기" },
  "au.removed": { en: "Automation removed", ko: "자동 발송을 삭제했습니다" },
  "ct.add": { en: "Add contact", ko: "연락처 추가" },
  "ct.badCsv": { en: "Invalid CSV: check quotes", ko: "잘못된 CSV입니다. 따옴표를 확인하세요" },
  "ct.clickChange": { en: "Click to change", ko: "클릭해서 변경" },
  "ct.consent": { en: "New contacts are not subscribed until consent is recorded.", ko: "동의가 기록되기 전까지 새 연락처는 수신 대상이 아닙니다." },
  "ct.csvHeaders": { en: "CSV requires name and email headers", ko: "CSV에 name과 email 머리글이 있어야 합니다" },
  "ct.dupe": { en: "This email already exists. No duplicate added.", ko: "이미 있는 이메일입니다. 중복 추가하지 않았습니다." },
  "ct.eyebrow": { en: "PEOPLE, NOT JUST ADDRESSES", ko: "주소가 아니라 사람입니다" },
  "ct.group": { en: "Group", ko: "그룹" },
  "ct.import": { en: "Import contacts", ko: "연락처 가져오기" },
  "ct.importCsv": { en: "Import CSV", ko: "CSV 가져오기" },
  "ct.newGroup": { en: "New group…", ko: "새 그룹…" },
  "ct.noConsent": { en: "Contact added without marketing consent", ko: "마케팅 수신 동의 없이 연락처를 추가했습니다" },
  "ct.sub": { en: "Keep the conversation going.", ko: "대화를 계속 이어 가세요." },
  "ct.title": { en: "Your audience starts here.", ko: "독자는 여기에서 시작됩니다." },
  "ct.whatImported": { en: "What will be imported", ko: "가져올 내용" },
  "db.bring": { en: "Bring your ideas to life, and your audience a little closer.", ko: "아이디어를 현실로, 독자를 조금 더 가까이." },
  "db.closer": { en: "One step closer to your audience", ko: "독자에게 한 걸음 더" },
  "db.connect": { en: "Connect your email provider to send your first newsletter.", ko: "이메일 공급자를 연결하면 첫 뉴스레터를 보낼 수 있습니다." },
  "db.delivery": { en: "Delivery overview", ko: "발송 개요" },
  "db.deliverySub": { en: "Your messages, over time", ko: "시간에 따른 발송 현황" },
  "db.empty": { en: "Your story is just getting started", ko: "이야기는 이제 막 시작됐습니다" },
  "db.eyebrow": { en: "YOUR NEWSLETTER STUDIO", ko: "뉴스레터 스튜디오" },
  "db.last30": { en: "Last 30 days", ko: "최근 30일" },
  "db.overview": { en: "Workspace overview", ko: "워크스페이스 개요" },
  "db.recent": { en: "Recent newsletters", ko: "최근 뉴스레터" },
  "db.recentSub": { en: "Fresh ideas and works in progress.", ko: "새로운 아이디어와 작업 중인 글입니다." },
  "db.trends": { en: "Delivery trends will appear after your first campaign.", ko: "첫 캠페인 이후에 발송 추이가 표시됩니다." },
  "db.upNext": { en: "Up next", ko: "다음 일정" },
  "db.utc": { en: "All times in UTC", ko: "모든 시각은 UTC 기준" },
  "ed.addBlock": { en: "Add a block", ko: "블록 추가" },
  "ed.addHere": { en: "Add a block here", ko: "여기에 블록 추가" },
  "ed.adding": { en: "Adding your image…", ko: "이미지를 추가하는 중…" },
  "ed.buttonLabel": { en: "Button label", ko: "버튼 문구" },
  "ed.byYou": { en: "By you", ko: "작성자 본인" },
  "ed.caption": { en: "Add a caption…", ko: "설명을 입력하세요…" },
  "ed.clickUpload": { en: "Click to upload", ko: "클릭해서 올리기" },
  "ed.delBlock": { en: "Delete block", ko: "블록 삭제" },
  "ed.drag": { en: "Drag to reorder", ko: "끌어서 순서 변경" },
  "ed.dupBlock": { en: "Duplicate block", ko: "블록 복제" },
  "ed.duplicated": { en: "Newsletter duplicated", ko: "뉴스레터를 복제했습니다" },
  "ed.featured": { en: "Your featured story…", ko: "주요 소식을 입력하세요…" },
  "ed.headline": { en: "Your headline…", ko: "제목을 입력하세요…" },
  "ed.howBlock": { en: "Hover a block for move, copy and delete.", ko: "블록에 마우스를 올리면 이동·복사·삭제가 나타납니다." },
  "ed.howPaste": { en: "Paste a copied image or video link anywhere.", ko: "복사한 이미지나 영상 링크를 어디에든 붙여넣으세요." },
  "ed.howText": { en: "Click any text on the page and just type.", ko: "페이지의 아무 글이나 눌러 바로 입력하세요." },
  "ed.howTo": { en: "How to edit", ko: "편집 방법" },
  "ed.imageAdded": { en: "Image added", ko: "이미지를 추가했습니다" },
  "ed.imagePasted": { en: "Image pasted", ko: "이미지를 붙여넣었습니다" },
  "ed.inFocus": { en: "IN FOCUS", ko: "주요 내용" },
  "ed.journal": { en: "JOURNAL", ko: "저널" },
  "ed.layout": { en: "Layout", ko: "레이아웃" },
  "ed.longer": { en: "The longer explanation…", ko: "자세한 설명…" },
  "ed.moveDown": { en: "Move down", ko: "아래로" },
  "ed.moveUp": { en: "Move up", ko: "위로" },
  "ed.orPaste": { en: "Or press Ctrl/Cmd+V to paste a copied image", ko: "또는 Ctrl/Cmd+V로 복사한 이미지를 붙여넣으세요" },
  "ed.pasteVideo": { en: "Paste a video link", ko: "영상 링크 붙여넣기" },
  "ed.previewFrame": { en: "Email-compatible newsletter preview", ko: "이메일 호환 뉴스레터 미리보기" },
  "ed.redo": { en: "Redo", ko: "다시 실행" },
  "ed.removeMedia": { en: "Remove media", ko: "미디어 제거" },
  "ed.selected": { en: "Selected block", ko: "선택한 블록" },
  "ed.status": { en: "Newsletter status", ko: "뉴스레터 상태" },
  "ed.title": { en: "Newsletter title", ko: "뉴스레터 제목" },
  "ed.undo": { en: "Undo", ko: "실행 취소" },
  "ed.videoAdded": { en: "Video added", ko: "영상을 추가했습니다" },
  "md.cancel": { en: "Cancel", ko: "취소" },
  "md.clear": { en: "Clear", ko: "지우기" },
  "md.clearAll": { en: "Clear all", ko: "모두 지우기" },
  "md.createNewsletter": { en: "Create a newsletter", ko: "뉴스레터 만들기" },
  "md.everyPhone": { en: "Every subscribed phone", ko: "수신 동의한 모든 휴대폰" },
  "md.noSubscribed": { en: "No subscribed contacts for this channel.", ko: "이 채널에 수신 동의한 연락처가 없습니다." },
  "md.notified": { en: "Notification sent", ko: "알림을 보냈습니다" },
  "md.pasteReply": { en: "Paste the reply", ko: "답변 붙여넣기" },
  "md.promptCopied": { en: "Prompt copied", ko: "프롬프트를 복사했습니다" },
  "md.startDraft": { en: "Start the draft", ko: "초안 시작" },
  "md.theyReceive": { en: "They receive", ko: "받는 내용" },
  "nl.campaignSnaps": { en: "Campaign snapshots", ko: "캠페인 기록" },
  "nl.colStatus": { en: "Status", ko: "상태" },
  "nl.colTitle": { en: "Newsletter", ko: "뉴스레터" },
  "nl.colUpdated": { en: "Updated", ko: "수정일" },
  "nl.create": { en: "Create newsletter", ko: "뉴스레터 만들기" },
  "nl.edit": { en: "Edit newsletter", ko: "뉴스레터 편집" },
  "nl.eyebrow": { en: "THE EDITORIAL SHELF", ko: "편집 서가" },
  "nl.find": { en: "Find a newsletter…", ko: "뉴스레터 찾기…" },
  "nl.lastUpdated": { en: "Last updated", ko: "마지막 수정" },
  "nl.nextChapter": { en: "Ready for its next chapter?", ko: "다음 장을 시작할까요?" },
  "nl.noData": { en: "No delivery data yet", ko: "아직 발송 데이터가 없습니다" },
  "nl.publication": { en: "Publication", ko: "발행" },
  "nl.snapshots": { en: "Campaign audience snapshots", ko: "캠페인 수신자 기록" },
  "nl.snapshotsEmpty": { en: "Recipient records appear after a campaign is created.", ko: "캠페인을 만들면 수신자 기록이 표시됩니다." },
  "nl.sub": { en: "Create, collect, and keep your next great idea moving.", ko: "만들고, 모으고, 다음 아이디어를 이어 가세요." },
  "nl.title": { en: "Your words. All together.", ko: "당신의 글, 한자리에." },
  "ed.pasteHint": { en: "Paste with Ctrl/Cmd+V · YouTube, Vimeo or .mp4", ko: "Ctrl/Cmd+V로 붙여넣으세요 · YouTube, Vimeo 또는 .mp4" },
  "ed.noVideoFile": {
    en: "Video files can't be stored yet — paste a YouTube, Vimeo or .mp4 link instead.",
    ko: "영상 파일은 아직 저장할 수 없습니다 — YouTube, Vimeo 또는 .mp4 링크를 붙여넣으세요.",
  },
  "ed.chooseImage": { en: "Please choose an image file.", ko: "이미지 파일을 선택하세요." },
  "an.emailDelivered": { en: "Email delivered", ko: "이메일 발송" },
  "an.smsDelivered": { en: "SMS delivered", ko: "문자 발송" },
  "an.uniqueRecipients": { en: "Unique recipients", ko: "수신자 수" },
  "an.failedMessages": { en: "Failed messages", ko: "실패한 메시지" },

  /* ---- automations form and phone alerts ---- */
  "af.channel": { en: "Channel", ko: "채널" },
  "af.group": { en: "Group", ko: "그룹" },
  "af.how": { en: "How it travels", ko: "발송 방식" },
  "af.latest": { en: "Always the most recently edited one", ko: "항상 가장 최근에 편집한 것" },
  "af.name": { en: "Name it", ko: "이름" },
  "af.namePlaceholder": { en: "Weekly issue", ko: "주간 뉴스레터" },
  "af.often": { en: "How often", ko: "발송 주기" },
  "af.search": { en: "Search contacts", ko: "연락처 검색" },
  "af.searchHint": { en: "Search by name or email", ko: "이름 또는 이메일로 검색" },
  "af.which": { en: "Which newsletter goes out", ko: "어떤 뉴스레터를 보낼까요" },
  "af.who": { en: "Who receives it", ko: "받는 사람" },
  "nb.addHome": { en: "Add to Home Screen", ko: "홈 화면에 추가" },
  "nb.confirmed": { en: "You will get new issues on this device.", ko: "이 기기로 새 호를 받게 됩니다." },
  "nb.getIphone": { en: "Get new issues on your iPhone", ko: "iPhone으로 새 호를 받아 보세요" },
  "nb.getPhone": { en: "Get new issues on your phone", ko: "휴대폰으로 새 호를 받아 보세요" },
  "nb.openBrowser": { en: "Open in browser", ko: "브라우저에서 열기" },
  "nb.share": { en: "Share", ko: "공유" },
  "nb.thenNotify": { en: "Open ML Lab from your Home Screen and tap Notify me", ko: "홈 화면에서 ML Lab을 열고 알림 받기를 누르세요" },
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  /* Starts in English so the server's markup and the browser's first paint
     agree; the stored or browser-preferred language is applied immediately
     afterwards, which is one frame, not a flash. */
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const first = firstLang();
    queueMicrotask(() => {
      setLangState(first);
      document.documentElement.lang = first;
    });
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE, next);
    } catch {
      // private window; the choice simply will not outlive the tab
    }
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: translator(lang) }),
    [lang, setLang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

/** The switch itself, so every page offers the same one. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useT();
  return (
    <button
      type="button"
      className={"lang-toggle " + className}
      aria-label={t("action.language")}
      title={t("action.language")}
      onClick={() => setLang(lang === "en" ? "ko" : "en")}
    >
      <Languages size={16} aria-hidden="true" />
      <span>{lang === "en" ? "EN" : "한국어"}</span>
    </button>
  );
}
