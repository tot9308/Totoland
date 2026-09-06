self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(event.request);
        const cache = await caches.open("totoland-v1");
        cache.put(event.request, res.clone());
        return res;
      } catch {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })()
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || "🌿 Totoland";
  const body = data.body || "Toca revisar las plantas";
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: "/icon.svg" })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});