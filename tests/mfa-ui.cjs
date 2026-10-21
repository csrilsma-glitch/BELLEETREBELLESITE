'use strict';
// Parcours navigateur sans identifiants réels : toutes les API sont simulées.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../site'),port=8775;
const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;const file=path.join(root,p.endsWith('/')?p+'index.html':p);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{await new Promise(r=>server.listen(port,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||chromium.executablePath(),headless:true,args:['--no-sandbox']});
for(const verified of [false,true,'csrilsma@gmail.com','belleetrebelle.flers@outlook.com']){
 const passwordOnly=typeof verified==='string';const authCalls=[];
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage();let logged=false,aal2=false,wrong=true,enrolls=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/.netlify/functions/**',async r=>{const n=r.request().url().split('/').pop(),d=r.request().postDataJSON();let code=200,v={ok:true};
 if(n==='manager-auth'){authCalls.push(d.action);
 if(d.action==='login'){logged=true;v={ok:true,mfa_required:!passwordOnly};}
 if(d.action==='factors')v={email:'manager@example.test',factors:verified?[{id:'11111111-1111-4111-8111-111111111111',status:'verified',factor_type:'totp'}]:[]};
 if(d.action==='enroll'){enrolls++;v={id:'22222222-2222-4222-8222-222222222222',totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg"/>',secret:'FAKE TEST VALUE'}};}
 if(d.action==='verify'){if(wrong){code=400;v={error:'Code TOTP invalide ou expiré.'};wrong=false;}else aal2=true;}
 if(d.action==='logout'){logged=false;aal2=false;}
 }else if(n==='manager'){if(!logged){code=401;v={error:'Connexion requise'};}else if(!aal2&&!passwordOnly){code=403;v={error:'Validation à deux facteurs requise'};}else v={services:[],clients:[],bookings:[],jobs:[],blocks:[],hours:[],settings:{},outlook:null};}
 await r.fulfill({status:code,contentType:'application/json',body:JSON.stringify(v)});});
 await page.goto('http://127.0.0.1:'+port+'/manager/');await page.locator('#login [name=email]').fill(passwordOnly?verified:'manager@example.test');await page.locator('#login [name=password]').fill('fake-test-only');await page.getByRole('button',{name:'Se connecter',exact:true}).click();if(passwordOnly){
 await page.locator('#studio').waitFor({state:'visible'});
 assert.equal(await page.locator('#mfa-panel').isVisible(),false);assert.equal(await page.locator('#mfa-qr').getAttribute('src'),null);
 assert.deepEqual(authCalls,['login']);assert.equal(enrolls,0);
 await page.locator('#logout').click();await page.locator('#login-panel').waitFor({state:'visible'});assert.deepEqual(errors,[]);await ctx.close();console.log('Connexion navigateur mot de passe seul OK : '+verified+' ; aucun QR, facteur ou code demandé.');continue;
}
await page.locator('#mfa-panel').waitFor({state:'visible'});
 assert.match(await page.locator('#mfa-info').textContent(),/manager@example.test/);
 if(!verified){assert.equal(await page.locator('#mfa').isVisible(),false);await page.locator('#enroll').click();await page.locator('#mfa-qr').waitFor({state:'visible'});}else assert.equal(await page.locator('#enroll').isVisible(),false);
 await page.locator('#mfa input').fill('123456');await page.locator('#mfa button').click();await page.getByText('Code TOTP invalide ou expiré.',{exact:true}).waitFor();assert.equal(await page.locator('#mfa-panel').isVisible(),true);assert.equal(await page.locator('#login-panel').isVisible(),false);
 await page.locator('#mfa input').fill('654321');await page.locator('#mfa button').click();await page.locator('#studio').waitFor({state:'visible'});assert.equal(await page.locator('#mfa-qr').getAttribute('src'),null);assert.equal(await page.locator('#mfa-secret').textContent(),'');
 await page.locator('#logout').click();await page.locator('#login-panel').waitFor({state:'visible'});assert.equal(enrolls,verified?0:1);assert.deepEqual(errors,[]);await ctx.close();console.log('MFA navigateur OK : '+(verified?'facteur vérifié préservé':'premier enrôlement')+', erreur récupérable, AAL2, déconnexion');
}await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
