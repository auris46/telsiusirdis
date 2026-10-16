/* Apsauga – leidžia programėlei veikti be interneto */
const CACHE = 'apsauga-v2';
const FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './extension/shared/i18n.js',
  './extension/shared/detector.js',
  './extension/icons/icon.svg',
  './extension/icons/icon192.png',
  './extension/icons/icon512.png',
  './vendor/jsQR.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pirmiausia tinklas (kad gautume atnaujinimus), be ryšio – iš talpyklos
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
