// エコーラン service worker: the whole game is one page plus a few files, so it all lives in the cache
// and the game opens offline. The page itself is fetched fresh when online (with a short timeout) so
// updates reach players on their next launch; everything else is served from the cache.
// The deploy workflow stamps VERSION with the commit, which refreshes the cache on every release.
const VERSION = 'dev';
const CACHE = 'echorun-' + VERSION;
const SHELL = [
  './',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'fonts/dela-gothic-one.woff2',
  'fonts/ibm-plex-mono-500.woff2',
  'fonts/ibm-plex-mono-600.woff2',
  'fonts/m-plus-rounded-1c-500.woff2',
  'fonts/m-plus-rounded-1c-800.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('echorun-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(page(req)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});

// network first for the page, but never keep a player on a slow connection waiting more than 3 s
async function page(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(res => { if (res.ok) cache.put('./', res.clone()); return res; });
  const late = new Promise(r => setTimeout(r, 3000));
  try {
    const res = await Promise.race([net, late]);
    if (res) return res;
  } catch (err) { /* offline: fall through to the cache */ }
  return (await cache.match('./')) || net;
}
