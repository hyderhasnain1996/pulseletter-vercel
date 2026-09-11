/* Service worker for phone notifications.

   Runs in the background even when the site is closed, which is what lets a
   new issue arrive on the lock screen. Kept deliberately small: show the
   notification, and open the issue when it is tapped. */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "New issue";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.svg",
    badge: "/favicon.svg",
    data: { url: payload.url || "/" },
    tag: payload.tag || "pulseletter",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";

  // Focus an already open tab rather than opening a second one.
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(target) && "focus" in client)
            return client.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});
