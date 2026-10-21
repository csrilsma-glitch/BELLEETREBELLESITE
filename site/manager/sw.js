/* Shell public uniquement : aucune API, donnée cliente ou page de récupération. */
const CACHE='br-manager-v15-6';
const SHELL=['/manager/','/manager/index.html','/manager/manager.css','/manager/manager.js','/manager/forgot.js','/manager/password-toggle.js','/manager/pwa-runtime.js','/manager/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/assets/fonts/october-crow.ttf'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('br-manager-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||!SHELL.includes(u.pathname)||u.search)return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(e.request,{cache:'no-store'});if(response.ok&&response.type==='basic')await cache.put(u.pathname,response.clone());return response;}
  catch(error){const saved=await cache.match(u.pathname);if(saved)return saved;throw error;}
 })());
});
