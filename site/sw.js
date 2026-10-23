/* Cache limité à ce site. Aucune API, page de connexion, vidéo ou donnée privée en cache. */
const CACHE='br-v15-20261023-press-context';
const SHELL=['./native.css','./catalogue-runtime.js','./offline.html','./styles.css','./v10.css','./melba-transparence-v10-1.css','./catalogue.js','./selecteur.js','./script.js','./assistant.js','./reservation.js','./gallery.js','./pwa.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/favicon.svg','./assets/fonts/october-crow.ttf','./assets/hero-art.jpg','./assets/melanie.jpg','./assets/melba-fond.png','./assets/crane-valide.png','./assets/familles-onglerie.jpg','./assets/familles-principales.jpg','./assets/depose-reference.jpg'];
const ALLOWED=new Set(SHELL.map(path=>new URL(path,self.location.href).pathname));
const PAGES=new Set(['./','./index.html','./reservation.html','./mentions-legales.html'].map(path=>new URL(path,self.location.href).pathname));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>/^br-v(10|14|15)-/.test(k)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/manager/')||url.pathname.startsWith('/.netlify/'))return;
  if(req.mode==='navigate'&&PAGES.has(url.pathname)){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),key=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
      try{
        const res=await fetch(req);
        if(res.ok&&res.type==='basic'&&res.headers.get('content-type')?.includes('text/html')){
          const text=await res.clone().text();
          if(text.includes('<meta name="application-name" content="Belle & Rebelle">'))await cache.put(key,res.clone());
        }
        return res;
      }catch(_){return await cache.match(key)||await cache.match('./offline.html');}
    })());return;
  }
  if(ALLOWED.has(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>{
    if(/\.(js|css)$/.test(url.pathname)){
      try{const res=await fetch(req,{cache:'no-cache'});if(res.ok&&res.type==='basic')await cache.put(req,res.clone());return res;}
      catch(error){const saved=await cache.match(req,{ignoreSearch:true});if(saved)return saved;throw error;}
    }
    const old=await cache.match(req,{ignoreSearch:true});if(old)return old;
    const res=await fetch(req);if(res.ok&&res.type==='basic')await cache.put(req,res.clone());return res;
  }));
});
