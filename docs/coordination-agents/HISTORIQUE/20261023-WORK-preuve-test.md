# Preuve reproductible CW-002

Exécutée sur 6bf3a31, Chromium 153. Modèle/calendrier/base simulés. Copier le bloc dans tests/cw002-independent.cjs du checkout de la PR #7 ; utiliser les dépendances npm verrouillées puis BROWSER_EXECUTABLE=/chemin/chromium node tests/cw002-independent.cjs. Aucune clé réelle. Ne pas exécuter contre la production.

```js
// CW-002 Work : vraie interface /app/ et gestionnaire HTTP, fournisseurs isolés.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
process.env.BOOKING_SIGNING_KEY='cw002-isolated-only';process.env.ANTHROPIC_API_KEY='cw002-never-sent';
const repo=process.env.BR_CW002_ROOT||path.resolve(__dirname,'..');
const root=path.join(repo,'site'),c=require(repo+'/netlify/functions/lib/core'),b=require(repo+'/netlify/functions/lib/booking'),chat=require(repo+'/netlify/functions/chat');
const catalogue=require(repo+'/site/assets/prestations.json').services;
const services=catalogue.map(s=>({id:s.id,name:s.name,path:s.path,minutes:s.id==='bb-2'?10:30,cents:s.id==='bb-2'?700:2500,active:true}));
let writes=[];const messages=[];
c.origin=()=>{};c.rate=async()=>{};c.db=async()=>services;
c.rpc=async(n)=>{if(n==='quote')return {services:[services.find(s=>s.id==='bb-2')],minutes:10,cents:700};if(n==='limit')return true;writes.push(n);throw Error('Unexpected write: '+n);};
b.availability=async d=>d==='2026-10-27'?['09:00','09:40','10:15'].map(h=>({starts:d+'T'+h+':00Z'})):[];
global.fetch=async(url,opts)=>{
 assert(String(url).startsWith('https://api.anthropic.com/'));
 const body=JSON.parse(opts.body),last=body.messages.at(-1);
 const result=Array.isArray(last.content)&&last.content.some(x=>x.type==='tool_result');
 return {ok:true,json:async()=>result?{stop_reason:'end_turn',content:[{type:'text',text:'Voici les horaires vérifiés.'}]}:{stop_reason:'tool_use',content:[{type:'tool_use',id:'cw-test',name:'check_availability',input:{date:'2026-10-27',service_ids:['bb-2']}}]}};
};
const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';const file=path.join(root,p);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(8789,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('**/.netlify/functions/**',async route=>{
  const req=route.request(),name=new URL(req.url()).pathname.split('/').pop();
  if(name==='catalog')return route.fulfill({json:{services,enabled:true}});
  assert.equal(name,'chat','aucun appel de réservation ni notification autorisé');
  const body=req.postDataJSON();messages.push(body);
  const out=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body)});
  await route.fulfill({status:out.statusCode,contentType:'application/json',body:out.body});
 });
 const page=await context.newPage();await page.goto('http://127.0.0.1:8789/app/');
 const frame=page.frameLocator('#site');await frame.locator('#welcome-enter').click();await frame.locator('#assistant-toggle').click();
 for(const [text,expected] of [['babyboomer 2 doigts','date'],['Le mardi 27 octobre','matin'],['Matin','10:40'],['10h40','numéro de téléphone'],['Nom : Cliente Test ; Téléphone : 0600000000 ; E-mail : cw-test@example.invalid','7 € pour 10 min']]){
  await frame.locator('#assistant-input').fill(text);await frame.locator('#assistant-form button').click();
  await frame.locator('#assistant-log .assistant-bot').last().waitFor();
  await frame.locator('#assistant-log .assistant-bot').filter({hasText:expected}).last().waitFor();
  const log=await frame.locator('#assistant-log').innerText();assert(log.includes(expected),text+' : '+log);
 }
 assert.equal(await frame.getByRole('button',{name:'Confirmer ce rendez-vous sans acompte',exact:true}).count(),1);
 assert.deepEqual(messages.at(-1).bookingContext.services,['bb-2']);assert.deepEqual(writes,[]);
 console.log('CW-002 : /app/ mobile + gestionnaire HTTP : bb-2, 10h40, coordonnées, récapitulatif 7 €/10 min ; aucune écriture : OK');
 await page.reload();await frame.locator('#assistant-toggle').click();
 assert(!(await frame.locator('#assistant-log').innerText()).includes('Cliente Test'));
 console.log('CW-003 : perte de conversation au rafraîchissement REPRODUITE ; correction Claude nécessaire');
 }finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

```

Sortie vérifiée :
```text
CW-002 : /app/ mobile + gestionnaire HTTP : bb-2, 10h40, coordonnées, récapitulatif 7 €/10 min ; aucune écriture : OK
CW-003 : perte de conversation au rafraîchissement REPRODUITE ; correction Claude nécessaire
```
