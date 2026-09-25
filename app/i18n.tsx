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
  "nav.newsletters": { en: "Custom newsletter", ko: "맞춤 뉴스레터" },
  "nav.quick": { en: "Send a picture", ko: "사진으로 보내기" },
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

  /* ---- quick send ---- */
  "qs.eyebrow": { en: "Send a picture", ko: "사진으로 보내기" },
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

  /* ---- nav, continued ---- */
  "nav.automations": { en: "Automations", ko: "자동 발송" },

  /* ---- block types.  The key carries the stored type id, which never
     changes; only what is shown beside it does. ---- */
  "blk.Title": { en: "Title", ko: "제목" },
  "blk.Introduction": { en: "Introduction", ko: "도입부" },
  "blk.Featured story": { en: "Featured story", ko: "주요 소식" },
  "blk.Details": { en: "Details", ko: "자세히" },
  "blk.Rich text": { en: "Rich text", ko: "본문" },
  "blk.Image": { en: "Image", ko: "이미지" },
  "blk.Video": { en: "Video", ko: "영상" },
  "blk.Image caption": { en: "Image caption", ko: "이미지 설명" },
  "blk.Article card": { en: "Article card", ko: "아티클 카드" },
  "blk.Announcement": { en: "Announcement", ko: "공지" },
  "blk.Event": { en: "Event", ko: "행사" },
  "blk.Button": { en: "Button", ko: "버튼" },
  "blk.Divider": { en: "Divider", ko: "구분선" },
  "blk.Social links": { en: "Social links", ko: "소셜 링크" },
  "blk.Footer": { en: "Footer", ko: "바닥글" },

  /* starter copy dropped in when a block is added */
  "seed.Title": { en: "Your headline goes here", ko: "여기에 제목을 입력하세요" },
  "seed.Introduction": {
    en: "A short, friendly opening line.",
    ko: "짧고 친근한 첫 문장.",
  },
  "seed.Featured story": {
    en: "The story you most want read.",
    ko: "가장 읽히고 싶은 이야기.",
  },
  "seed.Details": {
    en: "The longer explanation, tucked behind Read more.",
    ko: "더 보기 뒤에 숨겨 둘 자세한 설명.",
  },
  "seed.Rich text": { en: "Write anything you like here.", ko: "무엇이든 자유롭게 쓰세요." },
  "seed.Image": { en: "Add a caption", ko: "설명을 입력하세요" },
  "seed.Video": { en: "Add a caption", ko: "설명을 입력하세요" },
  "seed.Image caption": {
    en: "A few words about the picture.",
    ko: "사진에 대한 짧은 설명.",
  },
  "seed.Article card": { en: "A link worth clicking.", ko: "눌러 볼 만한 링크." },
  "seed.Announcement": { en: "Something worth knowing.", ko: "알아 둘 만한 소식." },
  "seed.Event": { en: "What, where and when.", ko: "무엇을, 어디서, 언제." },
  "seed.Button": { en: "Read more", ko: "더 보기" },
  "seed.Divider": { en: "", ko: "" },
  "seed.Social links": { en: "Find us anywhere.", ko: "어디서든 만나요." },
  "seed.Footer": { en: "Thanks for reading.", ko: "읽어 주셔서 고맙습니다." },

  /* ---- statuses and views ---- */
  "st.All statuses": { en: "All statuses", ko: "모든 상태" },
  "st.Draft": { en: "Draft", ko: "초안" },
  "st.Ready": { en: "Ready", ko: "발송 준비" },
  "st.Archived": { en: "Archived", ko: "보관됨" },
  "vw.Cards": { en: "Cards", ko: "카드" },
  "vw.Table": { en: "Table", ko: "표" },
  "act.Archive": { en: "Archive", ko: "보관" },
  "act.Restore": { en: "Restore", ko: "복원" },
  "act.Archived": { en: "Archived", ko: "보관했습니다" },
  "act.Restored": { en: "Restored", ko: "복원했습니다" },

  /* ---- automations form ---- */
  "af.Daily": { en: "Daily", ko: "매일" },
  "af.Weekly": { en: "Weekly", ko: "매주" },
  "af.Monthly": { en: "Monthly", ko: "매월" },
  "af.Every day": { en: "Every day", ko: "하루에 한 번" },
  "af.Every week": { en: "Every week", ko: "일주일에 한 번" },
  "af.Every month": { en: "Every month", ko: "한 달에 한 번" },
  "af.The usual rhythm": { en: "The usual rhythm", ko: "가장 흔한 주기" },
  "af.Everyone": { en: "Everyone", ko: "전체" },
  "af.Pick people": { en: "Pick people", ko: "직접 고르기" },
  "af.Email": { en: "Email", ko: "이메일" },
  "af.Phone alert": { en: "Phone alert", ko: "휴대폰 알림" },
  "af.All contacts": { en: "All contacts", ko: "모든 연락처" },
  "af.turnOn": { en: "Turn it on", ko: "켜기" },
  "af.noMatch": { en: "Nobody matches that search.", ko: "검색 결과가 없습니다." },
  "af.noneYet": {
    en: "No subscribed contacts yet. Add someone on Contacts & Groups first.",
    ko: "아직 수신 동의한 연락처가 없습니다. 먼저 연락처 및 그룹에서 추가하세요.",
  },
  "af.pickOne": { en: "Choose at least one person.", ko: "한 명 이상 선택하세요." },
  "af.pushNote": {
    en: "Phone alerts reach every device that turned notifications on. There is no group to choose.",
    ko: "휴대폰 알림은 알림을 켠 모든 기기에 전달됩니다. 그룹을 고를 필요가 없습니다.",
  },

  /* ---- phone alerts ---- */
  "nb.notifyMe": { en: "Notify me", ko: "알림 받기" },
  "nb.notifyNew": { en: "Notify me of new issues", ko: "새 호 알림 받기" },
  "nb.moment": { en: "Just a moment…", ko: "잠시만요…" },
  "nb.turnOff": { en: "Turn off", ko: "알림 끄기" },
  "nb.free": {
    en: "Free. Arrives on your phone like a message — no app, no sign-up.",
    ko: "무료입니다. 앱도 가입도 없이 문자처럼 휴대폰에 도착합니다.",
  },
  "nb.unsupported": {
    en: "This browser cannot show notifications. Try Chrome or Safari.",
    ko: "이 브라우저는 알림을 지원하지 않습니다. Chrome이나 Safari를 사용해 보세요.",
  },
  "nb.blocked": {
    en: "Notifications are blocked for this site. Allow them in your browser settings.",
    ko: "이 사이트의 알림이 차단되어 있습니다. 브라우저 설정에서 허용해 주세요.",
  },
  "nb.saveFailed": {
    en: "Could not save your subscription.",
    ko: "알림 설정을 저장하지 못했습니다.",
  },
  "nb.refused": {
    en: "Your browser refused the request.",
    ko: "브라우저가 요청을 거부했습니다.",
  },
  "nb.appleNote": {
    en: "Apple only allows notifications for sites added this way. It takes two taps.",
    ko: "Apple은 이렇게 추가한 사이트에만 알림을 허용합니다. 두 번만 누르면 됩니다.",
  },

  /* ---- sign-in and quick send leftovers ---- */
  "lp.signedIn": {
    en: "You are signed in. Your drafts, contacts and schedules are waiting.",
    ko: "이미 로그인되어 있습니다. 초안과 연락처, 예약이 기다리고 있습니다.",
  },
  "lp.openStudio": { en: "Open the studio", ko: "스튜디오 열기" },
  "qs.readFull": { en: "Read the full issue", ko: "전체 호 읽기" },
  "qs.htmlPreview": { en: "HTML preview", ko: "HTML 미리보기" },
  "af.aGroup": { en: "A group", ko: "그룹" },
  "af.dailyHint": { en: "A daily pulse", ko: "매일 짧게" },
  "af.monthlyHint": { en: "A fuller round-up", ko: "한 달치 모음" },
  "af.atNine": { en: "at 09:00 UTC", ko: "UTC 오전 9시" },
  "af.anEmail": {
    en: "An email to {audience}. First send {day}.",
    ko: "{audience}에게 이메일을 보냅니다. 첫 발송은 {day}.",
  },
  "af.aPhoneAlert": {
    en: "A phone alert to {audience}. First send {day}.",
    ko: "{audience}에게 휴대폰 알림을 보냅니다. 첫 발송은 {day}.",
  },
  "lp.signingIn": { en: "Signing in…", ko: "로그인 중…" },
  "rd.curated": {
    en: "Thoughtfully curated. Made to be shared.",
    ko: "정성껏 골랏습니다. 나눠 보세요.",
  },
  "db.cleanSlate": {
    en: "A clean slate. A new opportunity.",
    ko: "빈 종이 한 장. 새로운 기회.",
  },
  "db.writeNext": {
    en: "Write your next issue, then send it straight away.",
    ko: "다음 호를 쓰고 바로 보내세요.",
  },

  /* ---- making an account ---- */
  "su.title": { en: "Create your account", ko: "계정 만들기" },
  "su.sub": {
    en: "Your own workspace, with its own newsletters and contacts.",
    ko: "뉴스레터와 연락처를 따로 두는 나만의 워크스페이스입니다.",
  },
  "su.name": { en: "Your name", ko: "이름" },
  "su.nameHint": { en: "Hana Kim", ko: "김하나" },
  "su.email": { en: "Email", ko: "이메일" },
  "su.emailHint": { en: "you@example.com", ko: "you@example.com" },
  "su.password": { en: "Choose a password", ko: "비밀번호 설정" },
  "su.passwordHint": { en: "At least 8 characters", ko: "8자 이상" },
  "su.create": { en: "Create account", ko: "계정 만들기" },
  "su.creating": { en: "Creating your account…", ko: "계정을 만드는 중…" },
  "su.newHere": { en: "New here?", ko: "처음이신가요?" },
  "su.haveAccount": { en: "Already have an account?", ko: "이미 계정이 있으신가요?" },
  "su.goSignIn": { en: "Sign in", ko: "로그인" },
  "su.enterName": { en: "Enter your name.", ko: "이름을 입력하세요." },
  "su.enterEmail": { en: "Enter your email.", ko: "이메일을 입력하세요." },
  "su.badEmail": {
    en: "That does not look like an email address.",
    ko: "이메일 주소 형식이 아닙니다.",
  },
  "su.shortPassword": {
    en: "Use at least 8 characters.",
    ko: "8자 이상으로 입력하세요.",
  },
  "su.taken": {
    en: "That email already has an account. Sign in instead.",
    ko: "이미 계정이 있는 이메일입니다. 로그인해 주세요.",
  },
  "su.needDatabase": {
    en: "Accounts need a database. Ask whoever set this up to add DATABASE_URL.",
    ko: "계정을 만들려면 데이터베이스가 필요합니다. 설치한 분에게 DATABASE_URL 설정을 요청하세요.",
  },
  "su.failed": {
    en: "Could not create your account. Please try again.",
    ko: "계정을 만들지 못했습니다. 다시 시도해 주세요.",
  },
  "su.signInEmail": { en: "Email or username", ko: "이메일 또는 아이디" },
  "su.signInEmailHint": {
    en: "you@example.com",
    ko: "you@example.com",
  },

  /* ---- dialog headings ---- */
  "dlg.create": { en: "A great issue starts here.", ko: "좋은 뉴스레터는 여기에서 시작됩니다." },
  "dlg.send": { en: "Send this issue", ko: "이번 호 보내기" },
  "dlg.contact": { en: "Meet your next reader", ko: "새로운 독자를 맞이하세요" },
  "dlg.import": { en: "Import your contacts", ko: "연락처 가져오기" },
  "dlg.automation": { en: "Create an automation", ko: "자동 발송 만들기" },
  "dlg.notifications": { en: "You’re all caught up", ko: "새로운 알림이 없습니다" },
  "dlg.setup": { en: "Connect your sending providers", ko: "발송 공급자 연결" },
  "dlg.sendSub": {
    en: "Add addresses or numbers and send straight away.",
    ko: "주소나 번호를 추가하고 바로 보내세요.",
  },
  "dlg.createSub": {
    en: "Describe your theme and let AI write it — or build it yourself.",
    ko: "주제를 설명하면 AI가 써 줍니다 — 직접 만들어도 됩니다.",
  },
  "dlg.automationSub": {
    en: "Set it once. The studio sends it on schedule from then on.",
    ko: "한 번만 설정하면 이후에는 일정에 맞춰 발송됩니다.",
  },
  "dlg.default": { en: "Your newsletter studio", ko: "뉴스레터 스튜디오" },
  "foot.pulse": {
    en: "A little pulse goes a long way.",
    ko: "작은 신호가 먼 곳까지 닿습니다.",
  },
  "foot.demo": { en: "Demo preview", ko: "데모 미리보기" },
  "db.headline": {
    en: "A little pulse. A lot of possibility",
    ko: "작은 신호 하나. 커다란 가능성",
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
