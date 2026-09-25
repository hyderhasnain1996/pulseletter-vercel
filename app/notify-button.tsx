"use client";
import { useT } from "./i18n";

import { useEffect, useState } from "react";

/* "Notify me" for readers.

   Asks the browser for permission, then hands the resulting subscription to
   the server. Everything here is free and built into the browser — no account
   and no messaging provider is involved. */

const urlBase64ToUint8Array = (base64: string) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

type State =
  | "checking"
  | "unsupported"
  | "ios-install"
  | "in-app"
  | "ready"
  | "on"
  | "busy"
  | "blocked";

/* iOS only allows notifications for a site the reader has installed, and never
   inside another app's built-in browser. Telling them which of the two applies
   is the difference between a dead end and two taps. */
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInAppBrowser = () =>
  /FBAN|FBAV|Instagram|Line|KAKAOTALK|NAVER|Twitter|WhatsApp|WeChat/i.test(
    navigator.userAgent,
  );

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

export function NotifyButton({ publicKey }: { publicKey: string }) {
  const { t } = useT();
  const [state, setState] = useState<State>("checking");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!publicKey) return setState("unsupported");
    if (isInAppBrowser()) return setState("in-app");
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return setState(isIOS() && !isInstalled() ? "ios-install" : "unsupported");
    if (typeof Notification === "undefined")
      return setState(isIOS() && !isInstalled() ? "ios-install" : "unsupported");
    if (Notification.permission === "denied") return setState("blocked");

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "ready"))
      .catch(() => setState("unsupported"));
  }, [publicKey]);

  if (state === "checking") return null;

  if (state === "in-app")
    return (
      <div className="notify-box">
        <p className="notify-title">{t("nb.getPhone")}</p>
        <p className="notify-note">
          You are viewing this inside another app. Tap the ••• or share icon and
          choose <strong>{t("nb.openBrowser")}</strong> (Safari or Chrome), then come
          back to this page to turn notifications on.
        </p>
      </div>
    );

  if (state === "ios-install")
    return (
      <div className="notify-box">
        <p className="notify-title">{t("nb.getIphone")}</p>
        <ol className="notify-steps">
          <li>
            Tap the <strong>{t("nb.share")}</strong> button at the bottom of Safari
          </li>
          <li>
            Choose <strong>{t("nb.addHome")}</strong>
          </li>
          <li>{t("nb.thenNotify")}</li>
        </ol>
        <p className="notify-note">
          {t("nb.appleNote")}
        </p>
      </div>
    );

  if (state === "unsupported")
    return (
      <p className="notify-note">
        {t("nb.unsupported")}
      </p>
    );

  if (state === "blocked")
    return (
      <p className="notify-note">
        {t("nb.blocked")}
      </p>
    );

  if (state === "on")
    return (
      <div className="notify-box">
        <p className="notify-on">{t("nb.confirmed")}</p>
        <button
          className="notify-off"
          onClick={async () => {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await fetch("/api/push/subscribe", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: sub.endpoint }),
              });
              await sub.unsubscribe();
            }
            setState("ready");
          }}
        >
          {t("nb.turnOff")}
        </button>
      </div>
    );

  return (
    <div className="notify-box">
      <button
        className="notify-on-button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          setNote("");
          try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              setState(permission === "denied" ? "blocked" : "ready");
              return;
            }
            const reg = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
            const res = await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub.toJSON()),
            });
            if (!res.ok) {
              const body = (await res.json()) as { error?: string };
              setNote(body.error ?? t("nb.saveFailed"));
              setState("ready");
              return;
            }
            setState("on");
          } catch {
            setNote(t("nb.refused"));
            setState("ready");
          }
        }}
      >
        {state === "busy" ? t("nb.moment") : t("nb.notifyNew")}
      </button>
      <p className="notify-note">
        {t("nb.free")}
      </p>
      {note && <p className="notify-note notify-warn">{note}</p>}
    </div>
  );
}
