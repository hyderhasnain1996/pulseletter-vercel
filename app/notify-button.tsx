"use client";

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

type State = "checking" | "unsupported" | "ready" | "on" | "busy" | "blocked";

export function NotifyButton({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("checking");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!publicKey) return setState("unsupported");
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return setState("unsupported");
    if (Notification.permission === "denied") return setState("blocked");

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "ready"))
      .catch(() => setState("unsupported"));
  }, [publicKey]);

  if (state === "checking") return null;

  if (state === "unsupported")
    return (
      <p className="notify-note">
        This browser cannot show notifications. On an iPhone, add this page to
        your Home Screen first, then open it from there.
      </p>
    );

  if (state === "blocked")
    return (
      <p className="notify-note">
        Notifications are blocked for this site. Allow them in your browser
        settings to get new issues.
      </p>
    );

  if (state === "on")
    return (
      <div className="notify-box">
        <p className="notify-on">You will get new issues on this device.</p>
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
          Turn off
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
              setNote(body.error ?? "Could not save your subscription.");
              setState("ready");
              return;
            }
            setState("on");
          } catch {
            setNote("Your browser refused the request.");
            setState("ready");
          }
        }}
      >
        {state === "busy" ? "Just a moment…" : "Notify me of new issues"}
      </button>
      <p className="notify-note">
        Free. Arrives on your phone like a message — no app, no sign-up.
      </p>
      {note && <p className="notify-note notify-warn">{note}</p>}
    </div>
  );
}
