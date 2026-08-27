// Service worker voor de Dinely PWA. Doel: snelle start, ook op een trage verbinding.
// - Statische app-bestanden (JS/CSS/fonts/afbeeldingen): cache-eerst (ze zijn gehasht/immutable).
// - Navigaties/HTML: meteen uit cache tonen en op de achtergrond verversen (stale-while-revalidate).
// - Alles van andere domeinen (Firebase, Mollie, Resend) laten we met rust.
const VERSION = "dinely-v15";
const CORE = ["/", "/login", "/start"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|gif|ico|webmanifest)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Alleen ons eigen domein cachen; externe calls (Firebase/Mollie/…) ongemoeid laten.
  if (url.origin !== self.location.origin) return;

  // Statische assets: cache-eerst (snel), anders netwerk + opslaan.
  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Navigaties/HTML: stale-while-revalidate (meteen uit cache, op de achtergrond verversen).
  const accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.includes("text/html")) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const fromNet = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached || caches.match("/"));
        return cached || fromNet;
      })
    );
    return;
  }
  // Overig (bijv. onze eigen GET-API's): gewoon het netwerk.
});
