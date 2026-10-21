'use strict';
// Régression du parcours de récupération Manager dans un navigateur réel.
// Les fonctions Netlify sont simulées (page.route) : aucun jeton réel, aucun e-mail, aucune donnée.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
const BASE='http://127.0.0.1:8766';

// Réponses simulées par action : { recovery: {start, verify, reset}, auth: {login} }
async function stubFunctions(page,{recovery={},auth={}}={}){
 const calls=[];
 await page.route('**/.netlify/functions/manager-recovery',route=>{const body=route.request().postDataJSON()||{};calls.push(body.action);const r=recovery[body.action]||{status:200,body:{ok:true}};route.fulfill({status:r.status,contentType:'application/json',body:JSON.stringify(r.body)});});
 await page.route('**/.netlify/functions/manager-auth',route=>{const body=route.request().postDataJSON()||{};calls.push('auth:'+body.action);const r=auth[body.action]||{status:200,body:{ok:true}};route.fulfill({status:r.status,contentType:'application/json',body:JSON.stringify(r.body)});});
 return calls;
}
const FAKE='#access_token=jeton-fictif-test&type=recovery&expires_in=3600';

(async()=>{
 await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||undefined});
 const errors=[];
 const newPage=async()=>{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));return page;};
 try{
  // 1. Lien arrivé sur la page d’accueil du Manager : transmis à la page de réinitialisation, mot de passe demandé.
  {
   const page=await newPage();await stubFunctions(page);
   await page.goto(BASE+'/manager/'+FAKE);
   await page.waitForURL('**/manager/reset-password.html**');
   assert.equal(new URL(page.url()).pathname,'/manager/reset-password.html');
   await page.locator('#recovery-password').waitFor({state:'visible'});
   assert.equal(await page.locator('#recovery-password').isVisible(),true);
   assert.equal(page.url().includes('access_token'),false,'jeton retiré de la barre d’adresse');
   await page.close();
  }
  // 2. Lien expiré : message clair, aide visible, aucun jeton demandé.
  {
   const page=await newPage();await stubFunctions(page);
   await page.goto(BASE+'/manager/reset-password.html#error=access_denied&error_code=otp_expired&error_description=x');
   assert.match(await page.locator('#recovery-status').textContent(),/a expiré/);
   assert.equal(await page.locator('#recovery-help').isVisible(),true);
   assert.equal(await page.locator('#recovery-password').isVisible(),false);
   await page.close();
  }
  // 3. Lien déjà utilisé ou invalide (pas de code expiré) : message « plus valide », sans détail technique.
  {
   const page=await newPage();await stubFunctions(page);
   await page.goto(BASE+'/manager/reset-password.html#error=access_denied&error_code=access_denied&error_description=anglais');
   const text=await page.locator('#recovery-status').textContent();
   assert.match(text,/plus valide|déjà utilisé/);
   assert.doesNotMatch(text,/anglais/);
   await page.close();
  }
  // 4. Page ouverte sans lien : demande d’ouvrir le lien reçu.
  {
   const page=await newPage();await stubFunctions(page);
   await page.goto(BASE+'/manager/reset-password.html');
   assert.match(await page.locator('#recovery-status').textContent(),/lien reçu par e-mail/);
   await page.close();
  }
  // 5. Mauvais code TOTP : message « code incorrect », pas « lien expiré », session conservée.
  {
   const page=await newPage();await stubFunctions(page,{recovery:{start:{body:{ok:true,mfa_required:true}},verify:{status:403,body:{error:'Code de sécurité incorrect ou expiré'}}}});
   await page.goto(BASE+'/manager/reset-password.html'+FAKE);
   await page.locator('#recovery-mfa').waitFor({state:'visible'});
   await page.fill('#recovery-mfa-form input[name=code]','000000');
   await page.click('#recovery-mfa-form button');
   await page.waitForFunction(()=>document.getElementById('recovery-status').textContent.includes('Code de sécurité incorrect'));
   const text=await page.locator('#recovery-status').textContent();
   assert.match(text,/Code de sécurité incorrect/);
   assert.equal(await page.locator('#recovery-password').isVisible(),false,'pas de changement sans code valide');
   assert.equal(await page.locator('#recovery-help').isVisible(),false);
   await page.close();
  }
  // 6. Session de récupération expirée pendant la réinitialisation : nouveau lien demandé.
  {
   const page=await newPage();await stubFunctions(page,{recovery:{reset:{status:401,body:{error:'Session de récupération expirée'}}}});
   await page.goto(BASE+'/manager/reset-password.html'+FAKE);
   await page.locator('#recovery-password').waitFor({state:'visible'});
   await page.fill('#recovery-form input[name=password]','mot-de-passe-fictif-12');
   await page.fill('#recovery-form input[name=confirmation]','mot-de-passe-fictif-12');
   await page.click('#recovery-form button:not([type=button])');
   await page.waitForFunction(()=>document.getElementById('recovery-status').textContent.includes('a expiré ou a déjà été utilisé'));
   assert.equal(await page.locator('#recovery-help').isVisible(),true);
   await page.close();
  }
  // 7. Réinitialisation réussie : lien de connexion affiché.
  {
   const page=await newPage();await stubFunctions(page);
   await page.goto(BASE+'/manager/reset-password.html'+FAKE);
   await page.locator('#recovery-password').waitFor({state:'visible'});
   await page.fill('#recovery-form input[name=password]','mot-de-passe-fictif-12');
   await page.fill('#recovery-form input[name=confirmation]','mot-de-passe-fictif-12');
   await page.click('#recovery-form button:not([type=button])');
   await page.locator('#recovery-done').waitFor({state:'visible'});
   assert.match(await page.locator('#recovery-status').textContent(),/Reconnectez-vous/);
   await page.close();
  }
  // 8. Connexion : délai d’attente d’Auth affiché clairement (pas « Service indisponible »).
  {
   const page=await newPage();await stubFunctions(page,{auth:{login:{status:503,body:{error:'Le service de connexion répond lentement. Réessayez dans un instant.'}}}});
   await page.goto(BASE+'/manager/');
   await page.fill('#login input[name=email]','test@example.test');
   await page.fill('#login input[name=password]','mot-de-passe-fictif');
   await page.click('#login button:not([type=button])');
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('répond lentement'));
   await page.close();
  }
  // 9. « Mot de passe oublié ? » : formulaire visible, message générique après demande.
  {
   const page=await newPage();await stubFunctions(page);
   await page.route('**/.netlify/functions/manager-forgot',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,message:'Si un accès Manager existe pour cette adresse, un lien de récupération vient d’être envoyé. Pensez à vérifier vos indésirables.'})}));
   await page.goto(BASE+'/manager/');
   await page.click('#forgot-open');
   await page.fill('#forgot-form input[name=email]','test@example.test');
   await page.click('#forgot-form button');
   await page.waitForFunction(()=>document.getElementById('forgot-status').textContent.includes('Si un accès Manager existe'));
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('TESTS RÉCUPÉRATION NAVIGATEUR OK : 9 parcours, fonctions simulées.');
 } finally {
  await browser.close();server.close();
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
