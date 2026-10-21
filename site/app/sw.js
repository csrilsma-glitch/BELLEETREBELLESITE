/* Service worker de B&R APP (périmètre /app/). Il ne met en cache que la coque de l'application.
   Aucune réponse de l'API, aucune page de réservation ni donnée cliente n'est conservée. */
const CACHE = 'br-app-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', '../assets/icon-192.png', '../assets/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('br-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/app/')) return;
  // Network first : une nouvelle version du manifeste ou de la coque ne reste pas figée en cache.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(e.request, { cache: 'no-cache' });
      const allowed = SHELL.some(path => new URL(path, self.location.href).pathname === url.pathname);
      if (allowed && !url.search && response.ok && response.type === 'basic') await cache.put(e.request, response.clone());
      return response;
    } catch (error) {
      const saved = await cache.match(e.request);
      if (saved) return saved;
      if (e.request.mode === 'navigate') return cache.match('./index.html');
      throw error;
    }
  })());
});
