const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core');
const n=require('../netlify/functions/lib/notifications');
const rt=require('../netlify/functions/lib/realtest');

const SAVED={...process.env};
const PREPROD={APP_ENV:'preproduction',RESEND_API_KEY:'cle-fictive',BREVO_API_KEY:'cle-fictive',BOOKING_SIGNING_KEY:'test-signing-key-fictif',
 SITE_URL:'https://belleetrebelle-v15-preproduction.netlify.app',EXPECTED_SUPABASE_PROJECT_REF:'xrpjrweqdhihloykabml',SUPABASE_URL:'https://xrpjrweqdhihloykabml.supabase.co'};
function setEnv(vars){process.env={...SAVED,...PREPROD,...vars};}
const FUTURE='2099-01-01T00:00:00Z',PAST='2020-01-01T00:00:00Z';
const MARKED={id:'b1',revision:1,status:'confirme',real_test_until:FUTURE,created_at:'2026-10-20T18:00:00Z',starts:'2026-10-27T08:00:00Z',ends:'2026-10-27T10:00:00Z',
 services:[{path:'Gel'},{path:'Pose'}],cents:7700,minutes:120,client_id:'c1',request_key:'11111111-1111-4111-8111-111111111111'};
// Coordonnées saisies par la cliente : ce sont elles qui reçoivent les envois, quelles qu'elles soient.
const CLIENT={id:'c1',name:'Cliente',email:'cliente@example.test',phone:'+33650581180'};
const job=(kind,event='confirmation')=>({id:'j1',kind,booking_id:'b1',dedupe:'b1:1:'+kind,payload:{event,revision:1}});

// Maquette : base, fournisseurs et ICS factices. priorRows = envois réels déjà faits sur la réservation,
// dailyRows = envois réels des dernières 24 h (plafond).
function harness({booking=MARKED,client=CLIENT,priorRows=[],dailyRows=[]}={}){
 const saved={db:c.db,request:c.request,ics:c.ics};const calls=[];
 c.db=async path=>{
  if(path.startsWith('br15_clients'))return [client];
  if(path.includes('claimed_at=gte.'))return dailyRows;
  if(path.startsWith('br15_jobs'))return priorRows;
  return [booking];
 };
 c.request=async(url,opts)=>{calls.push({url,opts});return {ok:true,status:200,json:async()=>({id:'re_fictif_1'})};};
 c.ics=()=>'BEGIN:VCALENDAR\r\nEND:VCALENDAR';
 return {calls,restore:()=>Object.assign(c,saved)};
}

test('essai réel : réservation non marquée → tout simulé, aucun appel',async()=>{
 setEnv({});const h=harness({booking:{...MARKED,real_test_until:null}});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : réservation marquée → un e-mail réel aux coordonnées saisies, marqué TEST, clé d’idempotence',async()=>{
 setEnv({});const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'re_fictif_1'});
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'https://api.resend.com/emails');
  assert.equal(h.calls[0].opts.headers['Idempotency-Key'],'b1:1:email-client');
  const body=JSON.parse(h.calls[0].opts.body);
  assert.deepEqual(body.to,['cliente@example.test']);
  assert.ok(body.subject.startsWith('[TEST préproduction] '));
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : réservation marquée → un SMS réel au téléphone saisi, marqué TEST',async()=>{
 setEnv({});const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'re_fictif_1'});
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'https://api.brevo.com/v3/transactionalSMS/sms');
  const body=JSON.parse(h.calls[0].opts.body);
  assert.equal(body.recipient,'+33650581180');
  assert.ok(body.content.startsWith('[TEST] '));
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : rappels, Manager, Outlook, modifications et annulations restent simulés',async()=>{
 setEnv({});const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('email-manager')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver({...job('email-reminder','rappel'),payload:{event:'rappel',revision:1}}),{provider_id:'preprod-simulated'});
  // Modification SMS : règle « pas de SMS pour les déplacements » (commit 85eb874) → obsolète, jamais envoyé.
  assert.deepEqual(await n.deliver(job('sms-confirmation','modification')),{obsolete:true});
  assert.deepEqual(await n.deliver(job('email-client','annulation')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver({...job('outlook'),payload:{revision:1}}),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : fenêtre expirée → simulé automatiquement',async()=>{
 setEnv({});const h=harness({booking:{...MARKED,real_test_until:PAST}});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : un seul e-mail réel par réservation (second envoi simulé)',async()=>{
 setEnv({});const h=harness({priorRows:[{id:'jx'}]});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : plafond quotidien atteint → simulé',async()=>{
 setEnv({});const h=harness({dailyRows:Array.from({length:rt.DAILY_CAP},(_,i)=>({id:'d'+i}))});
 try{
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : adresse saisie invalide → simulé, pas d’envoi',async()=>{
 setEnv({});const h=harness({client:{...CLIENT,email:'pas-une-adresse'}});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('essai réel : hors préproduction, la marque ne sert à rien (production inchangée)',async()=>{
 setEnv({APP_ENV:'production'});
 try{assert.equal(await rt.allowed(job('email-client'),MARKED),false);}
 finally{process.env={...SAVED};}
});

test('essai réel : SMS en échec après envoi incertain → état uncertain, aucune relance',async()=>{
 setEnv({});const saved={db:c.db,request:c.request,rpc:c.rpc};let served=0;
 c.db=async(path,opts)=>{
  if(opts&&opts.method==='PATCH')return [];
  if(path.startsWith('br15_clients'))return [CLIENT];
  if(path.startsWith('br15_jobs'))return [];
  return [MARKED];
 };
 c.request=async()=>{throw new Error('timeout');};
 c.rpc=async()=>served++?[]:[{...job('sms-confirmation'),attempts:1}];
 let patches=[];const realDb=c.db;c.db=async(p,o)=>{if(o&&o.method==='PATCH')patches.push(o.data);return realDb(p,o);};
 try{
  const r=await n.run();
  assert.deepEqual(r,[{id:'j1',state:'uncertain'}]);
  assert.equal(patches[0].state,'uncertain');
 }finally{Object.assign(c,saved);process.env={...SAVED};}
});
