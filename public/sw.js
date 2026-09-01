// Service worker voor de Dinely PWA. Doel: snelle start, ook op een trage verbinding.
// - Statische app-bestanden (JS/CSS/fonts/afbeeldingen): cache-eerst (ze zijn gehasht/immutable).
// - Navigaties/HTML: netwerk-eerst (HTML moet bij de gehashte chunks passen), offline uit cache.
// - Alles van andere domeinen (Firebase, Mollie, Resend) laten we met rust.
const VERSION = "dinely-v22";
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

  // Navigaties/HTML: NETWERK-EERST. De HTML verwijst naar gehashte JS-chunks;
  // serveren we oude HTML uit cache, dan wijst die naar chunks die na een nieuwe
  // deploy niet meer bestaan -> de app hangt. Vers ophalen houdt HTML en chunks
  // in sync; alleen offline vallen we terug op de cache.
  const accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
    );
    return;
  }
  // Overig (bijv. onze eigen GET-API's): gewoon het netwerk.
});
