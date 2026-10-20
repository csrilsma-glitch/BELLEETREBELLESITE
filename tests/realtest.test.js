const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core');
const n=require('../netlify/functions/lib/notifications');

// Environnement de base : aucune variable de mode de test, aucune clé réelle.
const SAVED={...process.env};
const BASE=Object.fromEntries(Object.entries(SAVED).filter(([k])=>!k.startsWith('PREPROD_REAL_TEST')));
const ON={
 APP_ENV:'preproduction',PREPROD_REAL_TEST:'true',PREPROD_REAL_TEST_EMAIL:'fiteleny@gmail.com',PREPROD_REAL_TEST_PHONE:'+33677600688',
 PREPROD_REAL_TEST_SINCE:'2026-10-20T00:00:00Z',PREPROD_REAL_TEST_UNTIL:'2099-01-01T00:00:00Z',
 RESEND_API_KEY:'cle-fictive',BREVO_API_KEY:'cle-fictive',BOOKING_SIGNING_KEY:'test-signing-key-fictif',
 SITE_URL:'https://belleetrebelle-v15-preproduction.netlify.app',EXPECTED_SUPABASE_PROJECT_REF:'xrpjrweqdhihloykabml',SUPABASE_URL:'https://xrpjrweqdhihloykabml.supabase.co'
};
function setEnv(vars){process.env={...BASE,...vars};}
const BOOKING={id:'b1',revision:1,status:'confirme',created_at:'2026-10-20T12:00:00Z',starts:'2026-10-27T08:00:00Z',ends:'2026-10-27T10:00:00Z',
 services:[{path:'Gel'},{path:'Pose'}],cents:7700,minutes:120,client_id:'c1',request_key:'11111111-1111-4111-8111-111111111111'};
const CLIENT={id:'c1',name:'Test',email:'FiteLeny@gmail.com',phone:'+33677600688'};

// Maquette : base, fournisseurs et ICS factices, compteur d'appels externes.
function harness({booking=BOOKING,client=CLIENT,prior=[]}={}){
 const saved={db:c.db,request:c.request,ics:c.ics,rpc:c.rpc};const calls=[];
 c.db=async path=>{
  if(path.startsWith('br15_clients'))return [client];
  if(path.startsWith('br15_jobs'))return prior;
  return [booking];
 };
 c.request=async(url,opts)=>{calls.push({url,opts});return {ok:true,status:200,json:async()=>({id:'re_fictif_1'})};};
 c.ics=()=>'BEGIN:VCALENDAR\r\nEND:VCALENDAR';
 return {calls,restore:()=>Object.assign(c,{db:saved.db,request:saved.request,ics:saved.ics,rpc:saved.rpc})};
}
const job=(kind,event='confirmation')=>({id:'j1',kind,booking_id:'b1',dedupe:'b1:1:'+kind,payload:{event,revision:1}});

test('test réel : désactivé par défaut, aucun appel fournisseur',async()=>{
 setEnv({APP_ENV:'preproduction',RESEND_API_KEY:'cle-fictive',BREVO_API_KEY:'cle-fictive'});
 const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : une confirmation e-mail partie une seule fois, marquée TEST, clé d’idempotence',async()=>{
 setEnv(ON);const h=harness();
 try{
  const r=await n.deliver(job('email-client'));
  assert.equal(r.provider_id,'re_fictif_1');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'https://api.resend.com/emails');
  assert.equal(h.calls[0].opts.headers['Idempotency-Key'],'b1:1:email-client');
  const body=JSON.parse(h.calls[0].opts.body);
  assert.deepEqual(body.to,['FiteLeny@gmail.com'].map(x=>x));
  assert.ok(body.subject.startsWith('[TEST préproduction] '));
  assert.ok(body.text.startsWith('TEST préproduction'));
 }finally{h.restore();setEnv({});}
});

test('test réel : une SMS de confirmation partie une seule fois, marquée TEST',async()=>{
 setEnv(ON);const h=harness();
 try{
  const r=await n.deliver(job('sms-confirmation'));
  assert.equal(r.provider_id,'re_fictif_1');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'https://api.brevo.com/v3/transactionalSMS/sms');
  const body=JSON.parse(h.calls[0].opts.body);
  assert.equal(body.recipient,'+33677600688');
  assert.ok(body.content.startsWith('[TEST] '));
 }finally{h.restore();setEnv({});}
});

test('test réel : e-mail Manager, rappels, modifications, annulations et Outlook restent simulés',async()=>{
 setEnv(ON);const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('email-manager')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver({...job('email-reminder','rappel'),payload:{event:'rappel',revision:1}}),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver(job('sms-confirmation','modification')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver(job('email-client','annulation')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver({...job('outlook'),payload:{revision:1}}),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : toute autre cliente reste simulée (e-mail ou téléphone différent)',async()=>{
 for(const client of [{...CLIENT,email:'autre@example.test'},{...CLIENT,phone:'+33600000000'}]){
  setEnv(ON);
  const h=harness({client});
  try{
   assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
   assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
   assert.equal(h.calls.length,0);
  }finally{h.restore();setEnv({});}
 }
});

test('test réel : une seconde confirmation e-mail est simulée (un seul envoi réel par canal)',async()=>{
 setEnv(ON);const h=harness({prior:[{id:'jx'}]});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : réservation créée avant l’activation → simulée',async()=>{
 setEnv(ON);const h=harness({booking:{...BOOKING,created_at:'2026-10-19T10:00:00Z'}});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : réservation annulée → pas d’envoi réel',async()=>{
 setEnv(ON);const h=harness({booking:{...BOOKING,status:'annule'}});
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : expiré → tout redevient simulé automatiquement',async()=>{
 setEnv({...ON,PREPROD_REAL_TEST_UNTIL:'2020-01-01T00:00:00Z'});const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : configuration incomplète (téléphone invalide) → inactif',async()=>{
 setEnv({...ON,PREPROD_REAL_TEST_PHONE:'06 77 60 06 88'});const h=harness();
 try{
  assert.equal(require('../netlify/functions/lib/realtest').active(),false);
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
  assert.equal(h.calls.length,0);
 }finally{h.restore();setEnv({});}
});

test('test réel : SMS en échec après envoi incertain → état uncertain, aucune relance',async()=>{
 setEnv(ON);const saved={db:c.db,request:c.request,rpc:c.rpc};const patches=[];let served=0;
 c.db=async(path,opts)=>{
  if(opts&&opts.method==='PATCH'){patches.push(opts.data);return [];}
  if(path.startsWith('br15_clients'))return [CLIENT];
  if(path.startsWith('br15_jobs'))return [];
  return [BOOKING];
 };
 c.request=async()=>{throw Object.assign(new Error('timeout'),{});};
 c.rpc=async()=>served++?[]:[{...job('sms-confirmation'),attempts:1}];
 try{
  const r=await n.run();
  assert.deepEqual(r,[{id:'j1',state:'uncertain'}]);
  assert.equal(patches[0].state,'uncertain');
 }finally{Object.assign(c,saved);setEnv({});}
});

process.env={...SAVED};
