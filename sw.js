// Service worker: keeps the site's files and photos on the visitor's device,
// so repeat visits open instantly even on a slow connection.
// Bump VERSION after publishing changes to CSS/JS so visitors get the new files.
const VERSION = 'v2';
const STATIC = `ms-static-${VERSION}`;
const IMAGES = 'ms-images-v1';

const CORE = [
  '/', '/index.html', '/gallery.html', '/product.html', '/about.html', '/faq.html', '/contact.html',
  '/css/fonts.css', '/css/style.css',
  '/js/config.js', '/js/api.js', '/js/i18n.js', '/js/icons.js', '/js/layout.js',
  '/js/pages/home.js', '/js/pages/gallery.js', '/js/pages/product.js', '/js/pages/about.js', '/js/pages/faq.js', '/js/pages/contact.js',
  '/assets/logo-mask.png', '/assets/favicon.svg',
  '/fonts/tajawal-arabic-400-normal.woff2', '/fonts/tajawal-arabic-500-normal.woff2', '/fonts/tajawal-arabic-700-normal.woff2',
  '/fonts/el-messiri-arabic-600-normal.woff2',
];

self.addEventListener('install', (e) => {
  // best effort: one missing file must not break the install
  e.waitUntil(caches.open(STATIC).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('ms-static-') && k !== STATIC).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Photos never change once uploaded (every upload gets a new name) → cache-first, kept up to 150 files
async function imageFirst(req) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    cache.put(req, res.clone());
    cache.keys().then((keys) => { if (keys.length > 150) keys.slice(0, keys.length - 150).forEach((k) => cache.delete(k)); });
  }
  return res;
}

// Site files: answer from the device immediately, refresh the copy in the background
async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
  const fresh = fetch(req).then((res) => {
    if (res.ok && !res.redirected) cache.put(req.mode === 'navigate' ? new URL(req.url).pathname : req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.includes('/storage/v1/object/public/')) { e.respondWith(imageFirst(req)); return; }
  if (url.origin !== self.location.origin) return;           // data (Supabase REST) is handled by the page itself
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/backup')) return; // never cache the admin
  e.respondWith(staleWhileRevalidate(req));
});
