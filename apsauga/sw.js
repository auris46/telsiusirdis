/* Apsauga – leidžia programėlei veikti be interneto */
const CACHE = 'apsauga-v4';
const FILES = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './ocr.js',
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

// „Bendrinti → Apsauga“ (Android): tekstas keliauja adresu, nuotrauka – per talpyklą
async function handleShare(req) {
  const form = await req.formData();
  const q = new URLSearchParams();
  for (const k of ['title', 'text', 'url']) {
    const v = form.get(k);
    if (v) q.set(k, String(v).slice(0, 5000));
  }
  const img = form.get('image');
  if (img && typeof img !== 'string' && img.size) {
    const c = await caches.open('apsauga-share');
    await c.put('shared-image', new Response(img, { headers: { 'Content-Type': img.type || 'image/png' } }));
    q.set('image', '1');
  }
  return Response.redirect('./?' + q.toString() + '#zinute', 303);
}

// Pirmiausia tinklas (kad gautume atnaujinimus), be ryšio – iš talpyklos
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith(handleShare(req));
    return;
  }
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
