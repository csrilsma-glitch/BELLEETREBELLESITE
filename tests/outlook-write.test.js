const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core');

const SAVED={...process.env};
const ACCOUNT='belleetrebelle.flers@outlook.com';
const PREPROD={APP_ENV:'preproduction',OUTLOOK_PREPROD_TEST:'true',OUTLOOK_PREPROD_TEST_ACCOUNT:ACCOUNT,RESEND_API_KEY:'cle-fictive',BREVO_API_KEY:'cle-fictive',
 EXPECTED_SUPABASE_PROJECT_REF:'xrpjrweqdhihloykabml',SUPABASE_URL:'https://xrpjrweqdhihloykabml.supabase.co',SITE_URL:'https://belleetrebelle-v15-preproduction.netlify.app'};
function setEnv(vars){process.env={...SAVED,...vars};}
// Rechargement propre des modules Outlook et notifications (cache d'identité au niveau du module).
function fresh(){
 for(const m of ['../netlify/functions/lib/outlook','../netlify/functions/lib/notifications'])delete require.cache[require.resolve(m)];
 return {o:require('../netlify/functions/lib/outlook'),n:require('../netlify/functions/lib/notifications')};
}
const BOOKING={id:'b1',revision:1,status:'confirme',starts:'2026-10-30T09:30:00Z',ends:'2026-10-30T10:15:00Z',services:[{path:'Onglerie › Semi-permanent'}],cents:3500,client_id:'c1',request_key:'k'};

// Maquette : base (calendrier, mapping), Graph (/me, événements) et déchiffrement du jeton.
function harness({me=ACCOUNT,mapping=null}={}){
 const saved={db:c.db,request:c.request,unseal:c.unseal,rpc:c.rpc};const graphCalls=[];const writes=[];let mappingRows=mapping?[mapping]:[];
 c.unseal=()=>({access_token:'jeton-fictif',refresh_token:'r',expires_at:Date.now()+3600000});
 c.db=async(path,opts)=>{
  if(path.startsWith('br15_outlook?'))return [{encrypted:'x',calendar_id:'cal-test',error:null}];
  if(path.startsWith('br15_outlook_events')){if(opts&&opts.method==='DELETE')return [];if(opts&&opts.data){mappingRows=[{booking_id:'b1',event_id:opts.data.event_id}];}return mappingRows;}
  if(path.startsWith('br15_bookings'))return [BOOKING];
  if(path.startsWith('br15_jobs'))return [];
  return [];
 };
 c.request=async(url,opts={})=>{
  graphCalls.push({url:String(url),method:opts.method||'GET',body:opts.body});
  if(String(url).includes('/me?'))return {ok:true,status:200,json:async()=>({mail:me,userPrincipalName:me,otherMails:[]})};
  if(String(url).includes('/events')){writes.push({method:opts.method||'GET',url:String(url),body:opts.body});return {ok:true,status:200,json:async()=>({id:'evt-'+writes.length})};}
  return {ok:true,status:200,json:async()=>({})};
 };
 return {graphCalls,writes,restore:()=>Object.assign(c,saved)};
}

test('outlook préproduction : sans drapeau, aucune identité vérifiée ni écriture',async()=>{
 setEnv({...PREPROD,OUTLOOK_PREPROD_TEST:'false'});const h=harness();const {o,n}=fresh();
 try{
  assert.equal(await o.testWriteAllowed(),false);
  assert.deepEqual(await n.deliver({id:'j1',kind:'outlook',booking_id:'b1',dedupe:'b1:1:outlook',payload:{revision:1}}),{provider_id:'preprod-simulated'});
  assert.equal(h.graphCalls.length,0);
 }finally{h.restore();setEnv({});}
});

test('outlook préproduction : compte différent du compte désigné → aucune écriture',async()=>{
 setEnv(PREPROD);const h=harness({me:'autre@outlook.com'});const {o}=fresh();
 try{
  assert.equal(await o.testWriteAllowed(),false);
  await assert.rejects(o.push(BOOKING),/non autorisée/);
  assert.equal(h.writes.length,0);
 }finally{h.restore();setEnv({});}
});

test('outlook préproduction : compte désigné → un événement [TEST V15], pas de doublon à la relance',async()=>{
 setEnv(PREPROD);const h=harness();const {o}=fresh();
 try{
  assert.equal(await o.testWriteAllowed(),true);
  const id=await o.push(BOOKING);
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].method,'POST');
  const body=JSON.parse(h.writes[0].body);
  assert.ok(body.subject.startsWith('[TEST V15] '));
  assert.equal(body.start.dateTime,'2026-10-30T09:30:00.000');
  assert.equal(body.end.dateTime,'2026-10-30T10:15:00.000');
  assert.equal(body.transactionId,'b1');
  assert.ok(id);
  // Relance : le mapping existe déjà, donc mise à jour (PATCH) et pas de nouvel événement.
  const h2=harness({mapping:{booking_id:'b1',event_id:'evt-existant'}});
  const {o:o2}=fresh();
  try{await o2.push(BOOKING);assert.equal(h2.writes.length,1);assert.equal(h2.writes[0].method,'PATCH');assert.ok(h2.writes[0].url.endsWith('/events/evt-existant'));}
  finally{h2.restore();}
 }finally{h.restore();setEnv({});}
});

test('outlook préproduction : sans écriture autorisée, la tâche Outlook reste simulée',async()=>{
 setEnv({...PREPROD,OUTLOOK_PREPROD_TEST:'false'});const h=harness({me:'autre@outlook.com'});const {n}=fresh();
 try{
  const r=await n.deliver({id:'j2',kind:'outlook',booking_id:'b1',dedupe:'b1:1:outlook',payload:{revision:1}});
  assert.deepEqual(r,{provider_id:'preprod-simulated'});
  assert.equal(h.writes.length,0);
 }finally{h.restore();setEnv({});}
});

test('outlook production : l’écriture n’est pas bridée par les garde-fous de préproduction',async()=>{
 setEnv({APP_ENV:'',OUTLOOK_PREPROD_TEST:'false'});const h=harness({me:'autre@outlook.com'});const {o}=fresh();
 try{
  assert.equal(await o.testWriteAllowed(),true);
  assert.equal(h.graphCalls.filter(x=>x.url.includes('/me?')).length,0);
 }finally{h.restore();setEnv({});}
});
