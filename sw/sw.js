/*
 * Jogos IEQ service worker: lets the games open and play without internet.
 * The build fills in VERSION and FILES (every built file and public asset,
 * except the music, which the page downloads into its own cache).
 */
const VERSION = self.__VERSION__;
const FILES = self.__FILES__;
const CORE = `games-ieq-core-${VERSION}`;
const MUSIC = 'aurapads-music-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE);
      await cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('games-ieq-core-') && key !== CORE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function fromNetwork(req, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(req, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: try the network briefly (to pick up updates), else the saved copy.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fromNetwork(req, 3500);
          if (res.ok) return res;
          throw new Error(String(res.status));
        } catch {
          const cache = await caches.open(CORE);
          return (await cache.match('/', { ignoreVary: true })) || Response.error();
        }
      })(),
    );
    return;
  }

  // Music streams keep their own cache (managed by the page).
  if (url.pathname.startsWith('/music/')) {
    event.respondWith((async () => (await (await caches.open(MUSIC)).match(url.pathname, { ignoreVary: true })) || fetch(req))());
    return;
  }

  // Everything else: saved copy first, network as a fallback (and saved for next time).
  event.respondWith(
    (async () => {
      const cache = await caches.open(CORE);
      const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    })(),
  );
});
