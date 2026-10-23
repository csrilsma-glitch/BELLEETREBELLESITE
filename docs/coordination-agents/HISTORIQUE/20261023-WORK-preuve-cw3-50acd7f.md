# Preuve indépendante 50acd7f — nom minuscule

Checkout /tmp/br-cw10 fixé à 50acd7f ; remplacer chemins locaux pour reproduire. Aucun fournisseur réel.

```js
const {chromium}=require('/workspace/scratch/2b4bd7914797/br-parcours/node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');const root='/tmp/br-cw10/site';
let booked=0;
const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
(async()=>{let browser;try{await new Promise(r=>server.listen(8791,'127.0.0.1',r));browser=await chromium.launch({executablePath:'/workspace/scratch/2b4bd7914797/br-parcours/browser-runtime/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await context.route('**/.netlify/functions/**',async route=>{const req=route.request(),name=req.url().split('/').pop();if(name==='catalog')return route.fulfill({json:{services:[],enabled:true,privacy_text:'Fictif'}});if(name==='reservations'){booked++;return route.fulfill({json:{booking:{id:'11111111-1111-4111-8111-111111111111'},manage_url:'/reservation.html',notifications_disabled:true}});}assert.equal(name,'chat');const text=req.postDataJSON().messages.at(-1).content;const pending=text==='Recap';return route.fulfill({json:{reply:pending?'Récapitulatif fictif':text==='Kit complet uniquement'?'Quel est votre nom ?':'Message fictif reçu : '+text,signature:'test-only',bookingContext:{date:'2026-10-27',services:['press-kit-seul']},contextSignature:'test-only',...(pending?{pendingBooking:{service_ids:['press-kit-seul'],starts:'2026-10-27T09:40:00Z',client_name:'Cliente Fictive',client_email:'fake@example.invalid',client_phone:'0600000000',quote:{services:[{path:'Kit fictif'}],minutes:30,cents:2500}}}:{})}});});
const page=await context.newPage();await page.goto('http://127.0.0.1:8791/app/');let f=page.frameLocator('#site');await f.locator('#welcome-enter').click();await f.locator('#assistant-toggle').click();
async function ask(t){await f.locator('#assistant-input').fill(t);await f.locator('#assistant-form button').click();await f.locator('.assistant-bot').filter({hasText:t==='Recap'?'Récapitulatif fictif':t==='Kit complet uniquement'?'Quel est votre nom ?':'Message fictif reçu : '+t}).last().waitFor();}
await ask('Kit complet uniquement');await ask('cliente fictive');
let raw=await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1'));assert(raw.includes('cliente fictive'));console.log('ANO-CW10-001 : nom seul persiste dans sessionStorage : REPRODUIT');
await page.reload();await f.locator('#assistant-toggle').click();assert((await f.locator('#assistant-log').innerText()).includes('Kit complet uniquement'));assert((await f.locator('#assistant-log').innerText()).includes('cliente fictive'));console.log('/app/ iframe : melba-session.js actif ; conversation ET nom fictif restaurés après reload : VERIFIE');
await ask('Recap');await f.locator('input[type=checkbox]').check();await f.getByRole('button',{name:'Confirmer ce rendez-vous sans acompte'}).click();await f.getByText('Rendez-vous fictif enregistré.',{exact:false}).waitFor();assert.equal(booked,1);assert.equal(await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1')),null);console.log('Purge immédiatement après réservation simulée : OK');
await ask('Merci');raw=await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1'));assert(!raw.includes('cliente fictive'));console.log('ANO-CW10-002 : purge durable, Merci ne ressauve pas le nom : CORRIGÉ');
const S=require('/tmp/br-cw10/site/melba-session');const now=10000000,packed=S.pack({history:[{role:'user',content:'Kit'}]},now);assert(S.unpack(packed,now+S.TTL_MS-1));assert.equal(S.unpack(packed,now+S.TTL_MS+1),null);console.log('TTL déterministe 30 min : avant valide / après expiré : OK');
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

```

Sortie de l’exécution vérifiée :
```text
ANO-CW10-001 : nom seul persiste dans sessionStorage : REPRODUIT
/app/ iframe : melba-session.js actif ; conversation ET nom fictif restaurés après reload : VERIFIE
Purge immédiatement après réservation simulée : OK
ANO-CW10-002 : purge durable, Merci ne ressauve pas le nom : CORRIGÉ
TTL déterministe 30 min : avant valide / après expiré : OK
```
