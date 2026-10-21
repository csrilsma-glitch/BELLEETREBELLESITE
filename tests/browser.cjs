const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../site'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.svg':'image/svg+xml','.mp4':'video/mp4','.mp3':'audio/mpeg'};
fs.mkdirSync('test-results',{recursive:true});
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
const services=JSON.parse(fs.readFileSync(root+'/assets/prestations.json')).services.map((s,i)=>{const[h,m]=s.dur.split('h').map(Number);return {id:s.id,name:s.name,path:s.path,minutes:h*60+m,cents:s.price*100,position:i+1,active:true};});
const at=new Date(Date.now()+7*86400000);at.setUTCHours(9,0,0,0);const starts=at.toISOString(),ends=new Date(at.getTime()+105*60000).toISOString(),bid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';let booked=false,manager=false,stage=0,cancelled=false,cancelCalls=0;
const settings={enabled:true,lead_minutes:120,horizon_days:90,buffer_minutes:0,cancel_hours:24,retention_days:365,email_enabled:true,sms_confirmation:false,sms_reminder:false,outlook_required:false,privacy_text:'Information clientèle test — réservations uniquement.',compatibility:[]};
const dashboard=()=>({settings,services,hours:[{dow:1,opens:'09:00',closes:'18:00'}],blocks:[],jobs:[],outlook:null,clients:[{id:'c1',name:'Cliente Test',email:'test@example.test',phone:'+33600000000',notes:''}],bookings:[{id:bid,client_id:'c1',starts,ends,status:'confirme',cents:5400,minutes:105,services:[services[0],services[16]],revision:1}]});
(async()=>{await new Promise(r=>server.listen(8765,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});const SHIM=process.env.VIDEO_SHIM_DIR||'';const _nc=browser.newContext.bind(browser);browser.newContext=async o=>{const c=await _nc(o);if(SHIM)await c.route(/realisation-\d\d\.mp4/,r=>{const m=r.request().url().match(/realisation-(\d\d)\.mp4/);r.fulfill({path:SHIM+'/realisation-'+m[1]+'.webm',contentType:'video/webm'});});return c;};let errors=[];
for(const [name,width,height]of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844],['phone-landscape',844,390]]){
 cancelled=false;cancelCalls=0;
 const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));
 await page.route('**/.netlify/functions/**',async route=>{const req=route.request(),n=req.url().split('/').pop(),d=req.postDataJSON()||{};let v,code=200;
 if(n==='catalog')v={services,enabled:true,privacy_text:settings.privacy_text,cancel_hours:24};
 else if(n==='availability')v={slots:[{starts,ends}],quote:{minutes:105,cents:5400,services:[services[0],services[16]]}};
 else if(n==='reservations'){if(d.action==='view')v={id:bid,starts,ends,status:cancelled?'annule':'confirme',services:[services[0],services[16]],cents:5400};else if(d.action==='cancel'){cancelled=true;cancelCalls++;v={ok:true};}else{assert.equal(d.confirmed,true);assert.equal(d.consent,true);booked=true;v={ok:true,booking:{id:bid,starts,ends},token:'test-token',manage_url:'/reservation.html#booking='+bid+'&token=test-token'};}}
 else if(n==='manager-auth'){if(d.action==='factors')v={factors:[{id:bid,status:'verified',factor_type:'totp'}]};else{if(d.action==='verify')manager=true;v={ok:true};}}
 else if(n==='manager'){if(!manager){code=401;v={error:'Connexion requise'};}else v=dashboard();}
 else if(n==='chat')v={reply:'Voici votre proposition, à confirmer.',pendingBooking:{service_ids:[services[0].id,services[16].id],starts,client_name:'Cliente Test',client_phone:'+33600000000',client_email:'test@example.test',quote:{services:[services[0],services[16]],minutes:105,cents:5400}}};else v={ok:true};
 await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(v)});});
 await page.goto('http://127.0.0.1:8765/');await page.locator('#welcome-enter').click();await page.locator('#skull').scrollIntoViewIfNeeded();await page.locator('#sk-validate').click();await page.locator('#sk-validate').click();await page.locator('#sk-validate').click();assert((await page.locator('#selection-list').innerText()).includes('Gel sans rallongement'));console.log(name,'crâne et sélection OK');
 if(name==='desktop'){
   for(let i=1;i<=12;i++){
     await page.waitForFunction(()=>{const p=document.getElementById('realisation-player');return p.readyState>=2||p.error;});
     const result=await page.locator('#realisation-player').evaluate(async p=>{if(p.error)return {error:p.error.code};p.muted=true;try{await p.play();p.pause();return {ok:true,duration:p.duration};}catch(e){return {error:e.message};}});
     assert(result.ok,'Vidéo '+i+': '+JSON.stringify(result));
     if(i===1){
       await page.locator('#realisation-player').evaluate(p=>{p.currentTime=Math.max(0,p.duration-.1);return p.play();});
       await page.waitForFunction(()=>document.getElementById('realisation-player').ended);
     }
     if(i<12)await page.locator('#video-next').click();
   }
   console.log('12 vidéos : métadonnées et lecture Chromium OK');
   await page.locator('#video-next').click();
   await page.waitForFunction(()=>document.getElementById('realisation-player').readyState>=2);
   await page.locator('#realisation-player').evaluate(p=>{p.muted=true;p.currentTime=p.duration-.1;return p.play();});
   await page.waitForFunction(()=>document.getElementById('realisation-player').ended);
   await page.locator('#video-play').click();
   await page.waitForFunction(()=>{const p=document.getElementById('realisation-player');return !p.paused&&!p.ended&&p.currentTime<2;});
   await page.locator('#video-play').click();assert(await page.locator('#realisation-player').evaluate(p=>p.paused));
   await page.locator('#realisation-player').evaluate(p=>{window.previousVideo=p;});
   await page.locator('#video-next').click();
   assert(await page.evaluate(()=>!window.previousVideo.hasAttribute('src')&&window.previousVideo.paused&&!window.previousVideo.isConnected));
   assert.equal(await page.locator('.video-showcase video').count(),1);
   for(let i=0;i<8;i++)await page.locator(i%2?'#video-prev':'#video-next').click();
   await page.waitForFunction(()=>document.getElementById('realisation-player').readyState>=2);
   assert.equal(await page.locator('.video-showcase video').count(),1);
   await page.route('**/realisation-03.mp4',route=>route.fulfill({status:404,body:'test unavailable'}));
   await page.locator('#video-next').click();
   await page.waitForFunction(()=>!!document.getElementById('realisation-player').error);
   assert((await page.locator('#video-status').innerText()).includes('pas pu'));
   await page.unroute('**/realisation-03.mp4');await page.locator('#video-play').click();
   await page.waitForFunction(()=>document.getElementById('realisation-player').readyState>=2);
   assert(await page.locator('#realisation-player').evaluate(p=>!p.error));
   console.log('Vidéos : rejouer, pause, ressources libérées, navigation rapide et erreur/réessai OK');
 }

 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow accueil');await page.screenshot({path:'test-results/home-'+name+'.png',fullPage:false});
 await page.goto('http://127.0.0.1:8765/reservation.html?prestations='+services[0].id+','+services[16].id);await page.locator('#native-create').waitFor({state:'visible'});await page.locator('#booking-date').fill(starts.slice(0,10));await page.locator('#find-slots').click();await page.locator('#native-slots button').first().click();await page.locator('#client-name').fill('Cliente Test');await page.locator('#client-phone').fill('0600000000');await page.locator('#client-email').fill('test@example.test');await page.locator('#booking-consent').check();await page.locator('#booking-submit').click();await page.locator('#native-manage').waitFor({state:'visible'});assert(booked);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow réservation');await page.screenshot({path:'test-results/booking-'+name+'.png'});console.log(name,'réservation multi-prestations et confirmation OK');
 page.once('dialog',d=>d.accept());await page.locator('#cancel-booking').click();await page.locator('#manage-final').waitFor({state:'visible'});
 assert.equal(await page.locator('#manage-actions').isVisible(),false);assert.equal(await page.locator('#download-ics').isVisible(),false);assert.equal(await page.locator('#google-calendar').getAttribute('href'),null);assert.equal(await page.locator('#cancel-booking').isEnabled(),false);
 await page.locator('#cancel-booking').evaluate(b=>b.click());assert.equal(cancelCalls,1,'annulation répétée ignorée');
 await page.goto('http://127.0.0.1:8765/reservation.html#booking='+bid+'&token=test-token');await page.locator('#manage-final').waitFor({state:'visible'});assert.equal(await page.locator('#manage-actions').isVisible(),false);
 await page.screenshot({path:'test-results/cancelled-'+name+'.png'});console.log(name,'annulation finale, actions masquées, répétition et réouverture OK');
 await page.locator('#assistant-toggle').click();await page.locator('#assistant-input').fill('Je voudrais réserver');await page.locator('#assistant-form button').click();await page.locator('.assistant-confirm').waitFor();await page.locator('.assistant-msg input[type=checkbox]').check();await page.locator('.assistant-confirm').click();await page.getByText('Gérer mon rendez-vous',{exact:true}).waitFor();console.log(name,'Melba proposition + clic explicite OK');
 manager=false;await page.goto('http://127.0.0.1:8765/manager/');await page.locator('#login-panel').waitFor({state:'visible'});await page.locator('#login [name=email]').fill('manager@example.test');await page.locator('#login [name=password]').fill('fake');await page.getByRole('button',{name:'Se connecter',exact:true}).click();await page.locator('#mfa-panel').waitFor({state:'visible'});await page.locator('#mfa input').fill('123456');await page.locator('#mfa button').click();await page.locator('#studio').waitFor({state:'visible'});await page.screenshot({path:'test-results/manager-'+name+'.png',fullPage:false});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow Manager');
 await page.locator('[data-view=catalogue]').click();assert.equal(await page.locator('#service-list details').count(),64);await page.locator('[data-view=settings]').click();await page.locator('#outlook-status').waitFor({state:'visible'});console.log(name,'Manager connexion MFA, agenda, 64 prestations, paramètres OK');await ctx.close();
}
const pwa=await browser.newContext({serviceWorkers:'allow'}),pwaPage=await pwa.newPage();
await pwaPage.goto('http://127.0.0.1:8765/offline.html');
await pwaPage.evaluate(async()=>{const old=await caches.open('br-v14-stale-test');await old.put('/gallery.js',new Response('obsolete'));await old.put('/assets/videos/realisation-01.mp4',new Response('obsolete video'));});
await pwaPage.goto('http://127.0.0.1:8765/');await pwaPage.evaluate(()=>navigator.serviceWorker.ready);
await pwaPage.waitForFunction(()=>!!navigator.serviceWorker.controller);
assert(!(await pwaPage.evaluate(()=>caches.keys())).includes('br-v14-stale-test'));
await pwaPage.evaluate(async()=>{const current=(await caches.keys()).find(k=>k.startsWith('br-v15-'));await(await caches.open(current)).put('/gallery.js',new Response('obsolete'));});
assert((await pwaPage.evaluate(async()=>await(await fetch('/gallery.js')).text())).includes('function release(video)'));
const cached=await pwaPage.evaluate(async()=>{const keys=await caches.keys();return(await Promise.all(keys.map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();});
assert(!cached.some(p=>p.endsWith('.mp4')||p.startsWith('/.netlify/')));
await pwaPage.goto('http://127.0.0.1:8765/app/');
await pwaPage.evaluate(()=>navigator.serviceWorker.ready);
await pwaPage.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/app/sw.js'));
const clientManifest=await pwaPage.evaluate(async()=>await(await fetch(document.querySelector('link[rel=manifest]').href)).json());
assert.equal(clientManifest.id,'/app/');assert.equal(clientManifest.scope,'/app/');
await pwaPage.goto('http://127.0.0.1:8765/manager/');
await pwaPage.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/manager/sw.js'));
const managerManifest=await pwaPage.evaluate(async()=>await(await fetch(document.querySelector('link[rel=manifest]').href)).json());
assert.equal(managerManifest.id,'/manager/');assert.notEqual(managerManifest.id,clientManifest.id);
const scopes=await pwaPage.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>new URL(r.scope).pathname));
assert(scopes.includes('/app/')&&scopes.includes('/manager/'));
await pwaPage.goto('http://127.0.0.1:8765/app/');
assert((await pwaPage.evaluate(()=>navigator.serviceWorker.controller.scriptURL)).endsWith('/app/sw.js'));
console.log('PWA : coexistence réelle des workers /app/ et /manager/, manifests distincts, aucun écrasement');
await pwa.close();
console.log('PWA : ancien cache supprimé, JavaScript actualisé, aucune vidéo/API en cache');
await browser.close();server.close();assert.deepEqual(errors,[]);console.log('TESTS NAVIGATEUR OK : aucune erreur JavaScript. Fournisseurs simulés.');})().catch(e=>{console.error(e);process.exit(1);});
