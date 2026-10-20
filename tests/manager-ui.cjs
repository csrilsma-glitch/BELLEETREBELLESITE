'use strict';
// Recette V15 — Manager dans un vrai navigateur, API simulée (aucune donnée réelle, aucun appel réseau).
// Vérifie : bouton « Installer » masqué en mode autonome, messages près des actions,
// notes non confirmées signalées, périodes invalides refusées avant envoi, visibilité mobile.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const CLIENT='123e4567-e89b-42d3-a456-426614174000';
const PORT=8766;
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
function dashboard(state){return {settings:{enabled:false,lead_minutes:120,horizon_days:90,buffer_minutes:0,cancel_hours:24,retention_days:365,email_enabled:true,sms_confirmation:false,sms_reminder:false,outlook_required:false,privacy_text:'Test.',compatibility:[]},services:[],hours:[],blocks:state.blocks,jobs:[],outlook:null,bookings:[],clients:[{id:CLIENT,name:'Cliente Test',email:'test@example.test',phone:'+33600000000',notes:state.notes}]};}
(async()=>{
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
 const errors=[];
 for(const [name,width,height,standalone] of [['desktop',1440,1000,false],['mobile-standalone',390,844,true],['mobile-browser',390,844,false]]){
  const state={notes:'',blocks:[{id:'b1',starts:'2026-10-30T09:00:00Z',ends:'2026-10-30T10:00:00Z',label:'Congé',source:'manager'}]};
  const sent=[];let failNotes=true;
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(name+': '+e.message));
  if(standalone)await page.addInitScript(()=>{const real=window.matchMedia.bind(window);window.matchMedia=q=>q.includes('display-mode: standalone')?{matches:true,addEventListener(){},removeEventListener(){}}:real(q);});
  await page.route('**/.netlify/functions/**',async route=>{
   const req=route.request(),n=req.url().split('/').pop(),d=req.postDataJSON()||{};let v={ok:true},code=200;
   if(n==='manager'){
    if(d.action==='dashboard')v=dashboard(state);
    else if(d.action==='client'){sent.push('client');if(failNotes){code=503;v={error:'Notes non enregistrées. Réessayez.'};}else{state.notes=d.data.notes;}}
    else if(d.action==='block'){sent.push('block');state.blocks.push({id:'b2',starts:d.data.starts,ends:d.data.ends,label:d.data.label,source:'manager'});}
    else if(d.action==='unblock'){sent.push('unblock');state.blocks=state.blocks.filter(b=>b.id!==d.data.id);}
    else if(d.action==='history')v={bookings:[]};
    else v=dashboard(state);
   }
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(v)});
  });
  await page.goto('http://127.0.0.1:'+PORT+'/manager/');
  await page.waitForFunction(()=>!document.getElementById('studio').hidden);
  // Installer : masqué en mode autonome, visible sinon.
  const installVisible=await page.locator('#install').isVisible();
  assert.equal(installVisible,!standalone,name+' : bouton Installer');
  // Clientes : notes non confirmées → message près de la fiche, pas seulement en haut de page.
  await page.locator('[data-view="clients"]').click();
  const card=page.locator('#client-list article').first();
  await card.locator('textarea').fill('Note de test V15');
  await card.getByRole('button',{name:'Enregistrer les notes'}).click();
  await page.waitForFunction(()=>document.querySelector('#client-list .inline-msg')?.textContent.includes('Notes non enregistrées'));
  assert.equal(await card.locator('.inline-msg.error').count(),1,name+' : erreur près de la fiche');
  failNotes=false;
  await card.getByRole('button',{name:'Enregistrer les notes'}).click();
  await page.waitForFunction(()=>document.querySelector('#client-list .inline-msg')?.textContent.includes('vérifiées'));
  assert.equal(state.notes,'Note de test V15',name+' : note reçue par le serveur');
  // Périodes : fin avant début refusée avant tout envoi.
  await page.locator('[data-view="settings"]').click();
  await page.locator('details:has(#block-form) > summary').click();
  await page.fill('#block-form [name=starts]','2026-10-29T12:00');
  await page.fill('#block-form [name=ends]','2026-10-21T13:00');
  await page.fill('#block-form [name=label]','Teste. Pause');
  await page.locator('#block-form button').click();
  assert.match(await page.locator('#block-msg').textContent(),/postérieure/,name+' : message période invalide');
  assert.equal(sent.filter(x=>x==='block').length,0,name+' : aucune requête pour une période invalide');
  // Période valide : confirmation visible.
  await page.fill('#block-form [name=ends]','2026-10-29T13:00');
  await page.locator('#block-form button').click();
  await page.waitForFunction(()=>document.getElementById('block-msg').textContent.includes('Période bloquée'));
  assert.equal(sent.filter(x=>x==='block').length,1,name+' : une requête pour la période valide');
  // Retirer : bouton visible et cliquable sur la ligne de la période.
  const remove=page.locator('.block-row button',{hasText:'Retirer'}).first();
  assert.equal(await remove.isVisible(),true,name+' : bouton Retirer visible');
  const box=await remove.boundingBox();assert.ok(box.height>=30,name+' : hauteur du bouton');
  // Pas de défilement horizontal de la page.
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=1,name+' : défilement horizontal de '+overflow+'px');
  await ctx.close();
  console.log('ok',name);
 }
 await browser.close();server.close();
 assert.deepEqual(errors,[],'erreurs JS : '+errors.join(' | '));
 console.log('manager-ui : tous les contrôles passent');
})().catch(e=>{console.error('ÉCHEC',e.message);process.exit(1);});
