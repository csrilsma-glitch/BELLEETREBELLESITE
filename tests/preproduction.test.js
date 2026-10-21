const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core');
const n=require('../netlify/functions/lib/notifications');

test('préproduction : anciens envois et Outlook bloqués même avec des clés configurées',async()=>{
 const previous={...process.env},fetch=global.fetch;let calls=0;
 process.env.APP_ENV='preproduction';process.env.RESEND_API_KEY='test';process.env.BREVO_API_KEY='test';process.env.SMS_ADMIN_TOKEN='test';
 process.env.SIMPLYBOOK_COMPANY='test';process.env.SIMPLYBOOK_API_KEY='test';
 global.fetch=async()=>{calls++;throw Error('unexpected external call');};
 try{
  const sms=await require('../netlify/functions/send-sms').handler({httpMethod:'POST',headers:{authorization:'Bearer test'},body:'{}'});
  assert.equal(sms.statusCode,410);
  const mail=await require('../netlify/functions/chat')._test.nativeRunTool('notify_melanie',{subject:'test',summary:'test'},{});
  assert.equal(mail.ok,false);
  await assert.rejects(require('../netlify/functions/simplybook').startTimesFor('test','2026-10-26'),/préproduction/);
  const outlook=require('../netlify/functions/lib/outlook');
  await assert.rejects(outlook.exchange({}),/préproduction/);
  await assert.rejects(outlook.graph('/me'),/préproduction/);
  assert.equal(calls,0);
 }finally{process.env=previous;global.fetch=fetch;}
});

test('préproduction : base de production refusée avant toute requête réseau',async()=>{
 const previous={...process.env},fetch=global.fetch;let calls=0;
 process.env.APP_ENV='preproduction';process.env.EXPECTED_SUPABASE_PROJECT_REF='mlbfnlidlvsqghcijuhw';
 process.env.SUPABASE_URL='https://mlbfnlidlvsqghcijuhw.supabase.co';
 global.fetch=async()=>{calls++;throw Error('unexpected network');};
 try{await assert.rejects(c.db('br15_services'),/isolée/);assert.equal(calls,0);}
 finally{process.env=previous;global.fetch=fetch;}
});
test('préproduction : URL différente de la base attendue refusée',async()=>{
 const previous={...process.env};process.env.APP_ENV='preproduction';
 process.env.EXPECTED_SUPABASE_PROJECT_REF='test-project';process.env.SUPABASE_URL='https://other.supabase.co';
 try{await assert.rejects(c.db('br15_services'),/isolée/);}finally{process.env=previous;}
});
test('préproduction : la file est traitée en simulation, sans appel fournisseur',async()=>{
 const previous={...process.env},fetch=global.fetch,rpc=c.rpc,db=c.db;let external=0;const patches=[];
 process.env.APP_ENV='preproduction';process.env.RESEND_API_KEY='test';process.env.BREVO_API_KEY='test';
 global.fetch=async()=>{external++;throw Error('appel externe interdit');};
 const jobs=[{id:'j1',kind:'email-client',booking_id:'b1',dedupe:'b1:1:email-client',payload:{revision:1,event:'confirmation'}},{id:'j2',kind:'outlook',booking_id:'b1',dedupe:'b1:1:outlook',payload:{revision:1}}];
 let served=0;c.rpc=async(name)=>name==='claim'?(served<jobs.length?[jobs[served++]]:[]):{};
 c.db=async(path,opts)=>{if(opts&&opts.method==='PATCH')patches.push({path,data:opts.data});return [{id:'b1',revision:1,status:'confirme',starts:'2099-01-01T10:00:00Z',client_id:'c1',services:[{path:'Gel'}],cents:5200,minutes:90,request_key:'k'}];};
 try{
  const results=await n.run();
  assert.equal(results.length,2);
  assert.ok(patches.every(p=>p.data.state==='sent'&&p.data.provider_id==='preprod-simulated'),JSON.stringify(patches));
  assert.equal(external,0);
 }finally{process.env=previous;global.fetch=fetch;c.rpc=rpc;c.db=db;}
});

test('préproduction : rappel dépassé ou révision remplacée marqué obsolète, pas simulé',async()=>{
 const previous={...process.env},rpc=c.rpc,db=c.db;const patches=[];
 process.env.APP_ENV='preproduction';
 c.db=async(path,opts)=>{if(opts&&opts.method==='PATCH')patches.push(opts.data);return [{id:'b1',revision:2,status:'confirme',starts:'2099-01-01T10:00:00Z'}];};
 try{
  assert.deepEqual(await n.deliver({kind:'email-client',booking_id:'b1',payload:{revision:1}}),{obsolete:true});
  assert.deepEqual(await n.deliver({kind:'email-reminder',booking_id:'b1',payload:{revision:2}}),{provider_id:'preprod-simulated'});
  let served=0;c.rpc=async()=>served++?[]:[{id:'j9',kind:'email-client',booking_id:'b1',dedupe:'x',payload:{revision:1}}];
  const r=await n.run();assert.deepEqual(r,[{id:'j9',state:'obsolete'}]);
 }finally{process.env=previous;c.rpc=rpc;c.db=db;}
});

test('préproduction : /jobs traite la file sans passer par Outlook',async()=>{
 const previous={...process.env},rpc=c.rpc,db=c.db;let outlookCalls=0;
 process.env.APP_ENV='preproduction';
 c.rpc=async()=>[];c.db=async()=>{outlookCalls++;throw Error('base non attendue');};
 try{
  const result=await require('../netlify/functions/jobs').run();
  assert.equal(result.statusCode,200);
  assert.equal(JSON.parse(result.body).simulated,true);
 }finally{process.env=previous;c.rpc=rpc;c.db=db;}
});

test('production : le chemin Resend reste inchangé (envoi réel simulé par fetch)',async()=>{
 const previous={...process.env},fetch=global.fetch,rpc=c.rpc,db=c.db;const urls=[];
 delete process.env.APP_ENV;process.env.RESEND_API_KEY='cle-fictive-test';process.env.BOOKING_SIGNING_KEY='test-signing-key-fictif';process.env.TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');process.env.SITE_URL='https://exemple.test';
 global.fetch=async(url,opt)=>{urls.push(String(url));return {ok:true,status:200,json:async()=>({id:'re_fictif'})};};
 c.db=async(path)=>path.startsWith('br15_clients')?[{id:'c1',name:'Cliente fictive',email:'nobody@example.test',phone:'+33600000000'}]:[{id:'b1',revision:1,status:'confirme',created_at:'2026-10-20T08:00:00Z',starts:'2099-01-01T10:00:00Z',ends:'2099-01-01T11:30:00Z',client_id:'c1',services:[{path:'Gel'}],cents:5200,minutes:90,request_key:'k'}];
 try{
  const r=await n.deliver({id:'j1',kind:'email-client',booking_id:'b1',dedupe:'d1',payload:{revision:1,event:'confirmation'}});
  assert.equal(r.provider_id,'re_fictif');
  assert.deepEqual(urls,['https://api.resend.com/emails']);
 }finally{process.env=previous;global.fetch=fetch;c.rpc=rpc;c.db=db;}
});

test('rappel e-mail dépassé : aucun envoi fournisseur',async()=>{
 const db=c.db;let calls=0;c.db=async()=>{calls++;return [{revision:1,status:'confirme',starts:'2000-01-01T10:00:00Z'}];};
 try{assert.deepEqual(await n.deliver({kind:'email-reminder',payload:{revision:1}}),{obsolete:true});assert.equal(calls,1);}
 finally{c.db=db;}
});

// Classement des échecs SMS : pas de relance aveugle après une demande possiblement acceptée.
async function runSmsWith(fetchImpl,env={}){
 const previous={...process.env},fetch=global.fetch,rpc=c.rpc,db=c.db;const patches=[];let served=0;
 delete process.env.APP_ENV;process.env.BREVO_API_KEY='cle-fictive-test';process.env.BOOKING_SIGNING_KEY='test-signing-key-fictif';
 Object.assign(process.env,env);
 global.fetch=fetchImpl;
 c.rpc=async(name)=>name==='claim'?(served++?[]:[{id:'s1',kind:'sms-confirmation',booking_id:'b1',dedupe:'b1:1:sms',payload:{revision:1,event:'confirmation'},attempts:1}]):{};
 c.db=async(path,opts)=>{if(opts&&opts.method==='PATCH')patches.push(opts.data);return path.startsWith('br15_clients')?[{id:'c1',name:'Cliente fictive',email:'x@example.test',phone:'+33600000000'}]:[{id:'b1',revision:1,status:'confirme',created_at:'2026-10-20T08:00:00Z',starts:'2099-01-01T10:00:00Z',ends:'2099-01-01T11:30:00Z',client_id:'c1',services:[{path:'Gel'}],cents:5200,request_key:'k'}];};
 try{await n.run();return patches[0];}
 finally{process.env=previous;global.fetch=fetch;c.rpc=rpc;c.db=db;}
}
test('SMS : erreur 5xx après envoi = incertain, pas de relance',async()=>{
 const p=await runSmsWith(async()=>({ok:false,status:500,json:async()=>({})}));
 assert.equal(p.state,'uncertain');
});
test('SMS : timeout réseau après envoi = incertain',async()=>{
 const p=await runSmsWith(async()=>{throw new Error('timeout');});
 assert.equal(p.state,'uncertain');
});
test('SMS : refus 4xx définitif = échec relançable',async()=>{
 const p=await runSmsWith(async()=>({ok:false,status:400,json:async()=>({})}));
 assert.equal(p.state,'failed');
});
test('SMS : clé absente = échec relançable, aucun envoi',async()=>{
 let calls=0;const p=await runSmsWith(async()=>{calls++;return {ok:true,status:200,json:async()=>({})};},{BREVO_API_KEY:undefined});
 assert.equal(p.state,'failed');assert.equal(calls,0);
});

test('régression : une prestation terminée ne déclenche aucun envoi (job « terminé » écarté, sans appel fournisseur)',async()=>{
const previous={...process.env},fetch=global.fetch,db=c.db;let external=0;
delete process.env.APP_ENV;process.env.RESEND_API_KEY='cle-fictive-test';process.env.BREVO_API_KEY='cle-fictive-test';
global.fetch=async()=>{external++;throw Error('appel fournisseur interdit');};
c.db=async()=>[{id:'b1',revision:1,status:'termine',starts:'2099-01-01T10:00:00Z',client_id:'c1',services:[{path:'Gel'}],cents:5200,request_key:'k'}];
try{
  for(const kind of ['email-client','email-manager','sms-confirmation']){
    assert.deepEqual(await n.deliver({kind,booking_id:'b1',payload:{revision:1,event:'terminé'}}),{obsolete:true},kind);
  }
  assert.equal(external,0);
}finally{process.env=previous;global.fetch=fetch;c.db=db;}
});
