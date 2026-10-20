const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core');
const n=require('../netlify/functions/lib/notifications');

// Préproduction : aucun e-mail ni SMS réel, même si une réservation porte encore un champ real_test_until
// et même si les clés fournisseurs sont présentes.
const SAVED={...process.env};
function setEnv(vars){process.env={...SAVED,...vars};}
const PREPROD={APP_ENV:'preproduction',RESEND_API_KEY:'cle-fictive',BREVO_API_KEY:'cle-fictive',BOOKING_SIGNING_KEY:'test-signing-key-fictif',
 SITE_URL:'https://belleetrebelle-v15-preproduction.netlify.app',EXPECTED_SUPABASE_PROJECT_REF:'xrpjrweqdhihloykabml',SUPABASE_URL:'https://xrpjrweqdhihloykabml.supabase.co'};
const BOOKING={id:'b1',revision:1,status:'confirme',real_test_until:'2099-01-01T00:00:00Z',created_at:'2026-10-21T10:00:00Z',starts:'2026-10-27T08:00:00Z',ends:'2026-10-27T09:00:00Z',
 services:[{path:'Gel'}],cents:5000,minutes:60,client_id:'c1',request_key:'11111111-1111-4111-8111-111111111111'};
const CLIENT={id:'c1',name:'Cliente',email:'cliente@example.test',phone:'+33650581180'};

function harness(){
 const saved={db:c.db,request:c.request,ics:c.ics,rpc:c.rpc};const external=[];
 c.db=async path=>path.startsWith('br15_clients')?[CLIENT]:path.startsWith('br15_bookings')?[BOOKING]:[];
 c.request=async(url)=>{external.push(String(url));return {ok:true,status:200,json:async()=>({id:'x'})};};
 c.ics=()=>'BEGIN:VCALENDAR\r\nEND:VCALENDAR';
 return {external,restore:()=>Object.assign(c,saved)};
}
const job=(kind,event='confirmation')=>({id:'j1',kind,booking_id:'b1',dedupe:'b1:1:'+kind,payload:{event,revision:1}});

test('préproduction : une réservation marquée real_test_until ne déclenche aucun envoi réel',async()=>{
 setEnv(PREPROD);const h=harness();
 try{
  for(const k of ['email-client','sms-confirmation','email-manager','email-reminder','sms-reminder']){
   const r=await n.deliver(job(k));
   assert.ok(r.provider_id==='preprod-simulated'||r.obsolete,k+' : '+JSON.stringify(r));
  }
  assert.equal(h.external.length,0,'aucun appel fournisseur : '+h.external.join(', '));
 }finally{h.restore();process.env={...SAVED};}
});

test('préproduction : une confirmation reste simulée, avec le même identifiant de file',async()=>{
 setEnv(PREPROD);const h=harness();
 try{
  assert.deepEqual(await n.deliver(job('sms-confirmation')),{provider_id:'preprod-simulated'});
  assert.deepEqual(await n.deliver(job('email-client')),{provider_id:'preprod-simulated'});
  assert.equal(h.external.length,0);
 }finally{h.restore();process.env={...SAVED};}
});

test('préproduction : le module d’essais réels n’existe plus',()=>{
 assert.throws(()=>require.resolve('../netlify/functions/lib/realtest'),/Cannot find module/);
});
