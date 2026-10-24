// Navigateur réel, serveur local, API et prestataires exclusivement simulés.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('site'),origin='http://127.0.0.1:8778';
const server=http.createServer((req,res)=>{let pathname=new URL(req.url,origin).pathname;if(pathname.endsWith('/'))pathname+='index.html';const file=path.join(root,pathname);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.json':'application/json'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{let browser;try{await new Promise(r=>server.listen(8778,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,args:['--no-sandbox'],headless:true});
const services=[{id:'gel',path:'Gel',minutes:60,cents:4000,active:true},{id:'deco',path:'Décoration',minutes:45,cents:1400,active:true}];
const slots=Array.from({length:96},(_,i)=>({starts:new Date(Date.UTC(2030,9,28,8,i*5)).toISOString()}));
for(const width of [390,820,1440]){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await ctx.newPage();let calls=[],delayAvailability=false,releaseAvailability,availabilityStarted,delayChat=false,releaseChat,chatStarted;
 await ctx.route('**/*',async r=>{if(!r.request().url().startsWith(origin))return r.abort();if(!r.request().url().includes('/.netlify/functions/'))return r.continue();const req=r.request(),name=req.url().split('/').pop(),d=req.postDataJSON()||{};calls.push(name);let data;
 if(name==='availability'&&delayAvailability){delayAvailability=false;await new Promise(resolve=>{releaseAvailability=resolve;availabilityStarted();});}
 if(name==='chat'&&delayChat){delayChat=false;await new Promise(resolve=>{releaseChat=resolve;chatStarted();});}
 if(name==='catalog')data={enabled:true,services,privacy_text:'Fictif'};
 else if(name==='availability')data={slots,quote:{services,minutes:105,cents:5400}};
 else if(name==='chat'&&/change d|stop/.test(d.messages.at(-1).content))data={reply:'Pas de souci ! 💕',signature:'fake',resetFlow:true};
 else if(name==='chat')data={reply:'**Avec plaisir** <img src=x onerror=alert(1)>',signature:'fake',pendingBooking:{service_ids:['gel','deco'],starts:slots[0].starts,client_name:'Test',client_email:'test@example.test',client_phone:'+33600000000',quote:{services,minutes:105,cents:5400}}};
 else if(name==='manager'&&d.action==='availability')data={slots};
 else if(name==='manager')data={settings:{compatibility:[]},services,hours:[],blocks:[],jobs:[],outlook:null,clients:[],bookings:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',starts:slots[0].starts,ends:'2030-10-28T11:00:00Z',status:'confirme',services,cents:5400,minutes:105}]};
 else data={ok:true};await r.fulfill({json:data});});
 await page.goto(origin+'/reservation.html?prestations=gel,deco');await page.locator('#booking-date').fill('2030-10-28');await page.locator('#find-slots').click();const select=page.locator('#native-slots-select');await select.waitFor();assert.equal(await select.locator('option').count(),97);assert.equal(await page.locator('#native-slots button').count(),0);assert((await select.boundingBox()).height<80);assert.equal(await page.locator('#booking-submit').isDisabled(),true);
 await select.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await select.selectOption('0');assert.equal(await page.locator('#booking-submit').isDisabled(),false);assert.match(await page.locator('#booking-review').innerText(),/105 min/);await page.locator('#booking-date').fill('2030-10-29');assert.equal(await select.count(),0);assert.equal(await page.locator('#booking-submit').isDisabled(),true);
 await page.locator('#assistant-toggle').click();await page.locator('#assistant-input').fill('Bonjour');await page.locator('#assistant-form button').click();await page.locator('.assistant-confirm').waitFor();assert.equal(await page.locator('.assistant-log img').count(),0);assert(!(await page.locator('#assistant-log').innerText()).includes('**'));await page.locator('#assistant-input').fill('Je change d’avis');await page.locator('#assistant-form button').click();assert.equal(await page.locator('.assistant-confirm').first().isDisabled(),true);
 if(width===390){
  const started=new Promise(resolve=>{availabilityStarted=resolve;});delayAvailability=true;
  await page.locator('#booking-date').fill('2030-10-30');await page.locator('#find-slots').click();await started;
  await page.locator('#booking-date').fill('2030-10-31');releaseAvailability();await page.waitForLoadState('networkidle');assert.equal(await page.locator('#native-slots-select').count(),0);
  const count=await page.locator('.assistant-confirm').count(),chatReady=new Promise(resolve=>{chatStarted=resolve;});delayChat=true;
  await page.locator('#assistant-input').fill('Réponse lente');await page.locator('#assistant-form button').click();await chatReady;
  assert(await page.locator('#assistant-form button').isDisabled());await page.getByRole('button',{name:'Arrêter la demande',exact:true}).click();await page.getByText('Pas de souci ! 💕',{exact:true}).last().waitFor();releaseChat();await page.waitForLoadState('networkidle');assert.equal(await page.locator('.assistant-confirm').count(),count);
  console.log('Courses réseau : réponse disponibilité après changement de date et ancienne réponse Melba après stop ignorées : OK');
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(origin+'/manager/');await page.locator('#studio').waitFor({state:'visible'});await page.locator('#agenda-date').fill('2030-10-28');await page.locator('#agenda-mode').selectOption('day');await page.locator('#refresh').click();await page.getByRole('button',{name:'Déplacer',exact:true}).first().click();await page.getByRole('button',{name:'Chercher les créneaux',exact:true}).first().click();const move=page.getByRole('combobox',{name:'Horaire de déplacement'});await move.waitFor();assert.equal(await move.locator('option').count(),97);const apply=page.getByRole('button',{name:'Confirmer le déplacement',exact:true});assert(await apply.isDisabled());await move.selectOption(slots[1].starts);assert(await apply.isEnabled());await page.getByRole('textbox',{name:'Nouvelle date',exact:true}).count();await page.locator('input[aria-label="Nouvelle date"]').fill('2030-10-29');assert.equal(await move.count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log(width+'px : 96 créneaux en select, clavier, invalidation, texte sûr, ancienne proposition désactivée, déplacement Manager compact : OK');await ctx.close();
}
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
