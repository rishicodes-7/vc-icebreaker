const CACHE = "vc-icebreaker-v1";
const STATIC = [
  "/",
  "/index.html",
  "/style.css",
  "/js/main.js",
  "/js/socket.js",
  "/js/state.js",
  "/js/ui.js",
  "/js/screens/lobby.js",
  "/js/screens/category.js",
  "/js/screens/game.js",
];

// Install — cache static assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", e => {
  // Skip socket.io requests — always needs network
  if (e.request.url.includes("/socket.io/")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});