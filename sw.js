const CACHE = 'personal-acc-v2';
const ASSETS = [
  '/my-accounting/personal_accounting.html',
  '/my-accounting/manifest.json',
  '/my-accounting/icon-192.png',
  '/my-accounting/icon-512.png',
];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local, passthrough for Sheets API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always passthrough for Google APIs
  if (url.hostname.includes('google') || url.hostname.includes('googleapis')) return;

  // Cache-first for same-origin
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for external (fonts etc.)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
