// © 2026 Sapphire Technology Ltd. All rights reserved. Unauthorised copying is prohibited.
// Keeps the app on the phone or computer, so it works with no internet. Nothing typed into it is ever stored.
const V = 'sapphire-recovery-6';
const FILES = ['./', 'index.html', 'app.js', 'app.css', 'sums.js', 'icon.svg', 'icon-180.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.webmanifest'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// The saved copy first, so it opens with no internet; a newer copy is fetched in the background for next time
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then((c) => c.match(e.request, {ignoreSearch: true}).then((hit) => {
    const fresh = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || fresh;
  })));
});
