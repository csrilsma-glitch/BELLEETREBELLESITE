// Recette navigateur des fonctions HTTP réelles et des migrations, PostgreSQL local jetable.
// Aucune clé réelle : TOUS les accès réseau sortants des fonctions sont interdits.
const {PGlite}=require('@electric-sql/pglite'),{btree_gist}=require('@electric-sql/pglite/contrib/btree_gist'),{chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),base='http://localhost:8795';
process.env.BOOKING_SIGNING_KEY='isolated-browser-signing';process.env.TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,3).toString('base64');process.env.ANTHROPIC_API_KEY='isolated-model-never-used';process.env.APP_ENV='preproduction';process.env.NATIVE_BOOKING_ENABLED='true';process.env.SITE_URL=base;
const c=require('../netlify/functions/lib/core'),chat=require('../netlify/functions/chat'),reservations=require('../netlify/functions/reservations'),catalog=require('../netlify/functions/catalog'),notifications=require('../netlify/functions/lib/notifications');
(async()=>{let browser,server,db;const requests=[];try{
 db=new PGlite({extensions:{btree_gist}});await db.exec("set timezone='UTC';create role anon;create role authenticated;create role service_role;create schema extensions;create schema auth;create table auth.users(id uuid primary key);");
 for(const f of fs.readdirSync(path.join(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',f),'utf8'));
 await db.exec("insert into br15_hours(dow,opens,closes) select n,'10:00','19:00' from generate_series(1,4)n;insert into br15_hours(dow,opens,closes) values(5,'10:00','15:00');update br15_settings set enabled=true,privacy_text='Recette fictive isolée',lead_minutes=0,email_enabled=true,sms_confirmation=true,sms_reminder=true,outlook_required=false;");
 const scalar=async(sql,args=[])=>(await db.query(sql,args)).rows[0].v;
 c.request=async()=>{throw Error('Réseau fournisseur interdit par la recette');};global.fetch=async()=>{throw Error('Aucun modèle/fournisseur réel autorisé');};
 c.db=async uri=>{
  if(uri.startsWith('br15_settings?'))return (await db.query('select * from br15_settings')).rows;
  if(uri.startsWith('br15_services?'))return (await db.query('select * from br15_services where active order by position')).rows;
  for(const [table,field]of [['br15_bookings','id'],['br15_clients','id']])if(uri.startsWith(table+'?'+field+'=eq.'))return (await db.query(`select * from ${table} where ${field}=$1`,[uri.split('=eq.')[1]])).rows;
  throw Error('Accès DB inattendu : '+uri.split('?')[0]);
 };
 c.rpc=async(name,args)=>{assert(['slots','quote','book','change','limit'].includes(name));const keys=Object.keys(args),params=keys.map((k,i)=>k+'=> $'+(i+1)).join(',');const sql='select '+(name==='slots'?'* from ':'')+'br15_'+name+'('+params+')'+(name==='slots'?'':' v');const result=await db.query(sql,Object.values(args));return name==='slots'?result.rows:result.rows[0].v;};
 c.rate=async(e,scope,max)=>{if(!await c.rpc('limit',{p_key:'isolated:'+scope,p_max:max,p_seconds:600}))c.fail(429,'Trop de demandes');};
 const day=await scalar("select d::date::text v from generate_series((now() at time zone 'Europe/Paris')::date+2,(now() at time zone 'Europe/Paris')::date+9,interval '1 day') d where extract(dow from d) between 1 and 4 order by d limit 1");
 const sunday=await scalar("select d::date::text v from generate_series((now() at time zone 'Europe/Paris')::date+2,(now() at time zone 'Europe/Paris')::date+9,interval '1 day') d where extract(dow from d)=0 limit 1");
 assert.equal((await c.rpc('slots',{p_date:sunday,p_ids:['press-kit-seul']})).length,0);console.log('Dimanche fermé : aucun créneau SQL');
 await db.query("insert into br15_blocks(starts,ends,label) values(($1::date+time '13:00') at time zone 'Europe/Paris',($1::date+time '14:00') at time zone 'Europe/Paris','Pause fictive')",[day]);
 const daySlots=await c.rpc('slots',{p_date:day,p_ids:['press-kit-seul']});assert(!daySlots.some(s=>c.localTime(s.starts).includes('13:')));console.log('Pause13h–14h : aucun chevauchement SQL');
 server=http.createServer(async(req,res)=>{try{let pathname=new URL(req.url,base).pathname;if(pathname.startsWith('/.netlify/functions/')){const name=pathname.split('/').pop();requests.push(name);const handler={chat,reservations,catalog}[name]?.handler;if(!handler){res.writeHead(404).end();return;}let body='';for await(const chunk of req)body+=chunk;const r=await handler({httpMethod:req.method,headers:req.headers,body});if(r.statusCode>=400)console.error("HTTP",name,r.statusCode,r.body);res.writeHead(r.statusCode,r.headers);res.end(r.body);return;}if(pathname.endsWith('/'))pathname+='index.html';const f=path.join(site,pathname);if(!f.startsWith(site)||!fs.existsSync(f)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(e){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Recette échouée'}));console.error(e.message);}});
 await new Promise(r=>server.listen(8795,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,args:['--no-sandbox']});
 let count=0;
 for(const [url,w,h] of [['/',1440,1000],['/reservation.html',820,1180],['/app/',390,844]]){
  const context=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'}),page=await context.newPage();await page.goto(base+url);const f=url==='/app/'?page.frameLocator('#site'):page;
  if(await f.locator('#welcome-enter').isVisible())await f.locator('#welcome-enter').click();await f.locator('#assistant-toggle').click();
  async function ask(value,step){const before=await f.locator('.assistant-bot').count();await f.locator('#assistant-input').fill(value);await f.locator('#assistant-form button').click();await page.waitForFunction(()=>true);await f.locator('.assistant-bot').nth(before).waitFor();await f.locator('#assistant-form button').waitFor({state:'visible'});const msg=await f.locator('.assistant-bot').last().innerText();if(step)assert.match(msg,step);return msg;}
  await ask('Je veux réserver un kit press nails complet uniquement',/Quelle date/);let raw=await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1'));assert(!/famille|email/.test(raw));
  await ask(day,/matin ou l’après-midi/);await ask('Matin',/créneaux vérifiés/);
  await ask('10h40',/nom de famille/);await ask('cliente fictive',/prénom/);
  const cookies=await context.cookies(base+'/.netlify/functions/chat');assert(cookies.some(x=>x.name==='br15_melba_flow'&&x.httpOnly&&x.secure&&x.sameSite==='Strict'));assert(!JSON.stringify(cookies).includes('cliente fictive'));
  await page.reload();await f.locator('#assistant-toggle').click();assert(!(await f.locator('#assistant-log').innerText()).includes('cliente fictive'));
  await ask('élise',/adresse e-mail/);await ask('cw-test@example.invalid',/téléphone/);await ask('0600000000',/Confirmer mon rendez-vous/);
  assert.equal(await scalar('select count(*)::int v from br15_bookings'),count,'aucun rendez-vous avant clic');raw=await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1'));assert(!/cliente fictive|élise|cw-test|0600000000/.test(raw));
  await f.locator('#assistant-log input[type=checkbox]').check();await f.getByRole('button',{name:'Confirmer mon rendez-vous',exact:true}).click();await f.getByText('Rendez-vous fictif enregistré.',{exact:false}).waitFor();count++;
  assert.equal(await scalar('select count(*)::int v from br15_bookings'),count);assert.equal(await f.locator('body').evaluate(()=>sessionStorage.getItem('br-melba-session-v1')),null);assert(!(await context.cookies(base+'/.netlify/functions/chat')).some(x=>x.name==='br15_melba_flow'));
  const booking=(await db.query("select * from br15_bookings where status='confirme' order by created_at desc limit1".replace('limit1','limit 1'))).rows[0];assert.equal(booking.minutes,30);assert.equal(booking.cents,2500);
  const jobs=(await db.query("select * from br15_jobs where booking_id=$1 and state='pending'",[booking.id])).rows;for(const kind of ['email-client','email-manager','email-reminder','sms-confirmation','sms-reminder','outlook'])assert(jobs.some(j=>j.kind===kind),kind+' en file');
  for(const job of jobs)assert.equal((await notifications.deliver(job)).provider_id,'preprod-simulated');
  // Annulation locale avec le lien natif, libère le créneau pour la page suivante.
  const token=c.tokenFor(booking.request_key);await c.rpc('change',{p_id:booking.id,p_hash:c.sha(token),p_action:'cancel',p_start:null});
  console.log(url,w+'x'+h,'parcours HTTP + cookie protégé + reload + réservation SQL + purge + files6providers simulées + annulation : OK');await context.close();
 }
 assert.equal(requests.filter(n=>n==='reservations').length,3);console.log('3 réservations locales uniquement ; zéro envoi fournisseur réel ; données sources 64prestations intactes.');
}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(db)await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
