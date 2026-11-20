/*
 * LifePath offline service worker.
 * - Page navigations / index.html: network-first, so a new deploy is picked up on the next
 *   launch while online; falls back to the cached shell when offline.
 * - Everything else (hashed JS/CSS, icons): cache-first.
 */
const CACHE = 'lifepath-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function store(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/index.html');
  if (isPage) {
    e.respondWith(
      fetch(req)
        .then((res) => store(req, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))),
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => store(req, res))));
});
