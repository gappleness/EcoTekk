/* EcoTekk PWA service worker. Project-site safe: all URLs are relative to the deployed app root. */
'use strict';
const APP_VERSION = '1.0.0';
const SHELL_CACHE = 'ecotekk-shell-' + APP_VERSION;
const RUNTIME_CACHE = 'ecotekk-runtime-' + APP_VERSION;
const CORE_FILES = [
  './', './index.html', './explore.html', './techhelp.html', './home.html', './ewaste.html',
  './login.html', './profile.html', './checklist.html', './offline.html', './manifest.webmanifest',
  './stylesheet.css', './experience.css', './tracker.css', './pwa.css',
  './theme.js', './auth.js', './activity.js', './content.js', './experience.js',
  './device-database.js', './planner.js', './tracker.js', './techhelp.js', './ewaste.js',
  './checklist.js', './community-tally.js', './firebase-config.js',
  './favicon.svg', './background.png', './apple-touch-icon.png', './pwa-icon-192.png', './pwa-icon-512.png', './pwa-icon-maskable-512.png'
];
const APP_ROOT = new URL('./', self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // One optional file failing must not prevent the rest of the app shell installing.
    await Promise.all(CORE_FILES.map(async path => {
      try {
        const url = new URL(path, APP_ROOT);
        const response = await fetch(url.href, { cache: 'reload' });
        if (response.ok) await cache.put(url.href, response);
      } catch (_) { /* A missing/temporarily unavailable asset can be fetched on first use. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ecotekk-') && name !== SHELL_CACHE && name !== RUNTIME_CACHE).map(name => caches.delete(name)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

function pageCacheKey(url) {
  // Do not persist location query values (lat/lng) in the offline cache.
  return new Request(url.origin + url.pathname);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never cache cross-origin services or personal/cloud responses. Firebase, Google Maps and
  // Google Fonts remain network services; the local app shell is what works offline.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_ROOT.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const key = pageCacheKey(url);
      try {
        const preload = await event.preloadResponse;
        const response = preload || await fetch(request);
        if (response && response.ok) await cache.put(key, response.clone());
        return response;
      } catch (_) {
        const saved = await cache.match(key) || await caches.match(key);
        if (saved) return saved;
        return (await caches.match(new URL('./offline.html', APP_ROOT).href)) || new Response('You are offline. Reconnect and try again.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  const destination = request.destination;
  const isLocalAsset = ['style', 'script', 'image', 'font', 'worker'].includes(destination) || /\.(?:css|js|png|svg|webmanifest|ico|woff2?)$/i.test(url.pathname);
  if (!isLocalAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      return new Response('', { status: 504, statusText: 'Offline asset unavailable' });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
