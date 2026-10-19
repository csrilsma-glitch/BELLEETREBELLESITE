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
  assert.equal(sms.statusCode,503);
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
test('préproduction : aucun job réclamé ni appel fournisseur même en invocation directe',async()=>{
 const previous={...process.env},rpc=c.rpc,db=c.db;let calls=0;
 process.env.APP_ENV='preproduction';c.rpc=c.db=async()=>{calls++;throw Error('unexpected action');};
 try{assert.deepEqual(await n.run(),[]);await assert.rejects(n.deliver({}),/désactivés/);
 const result=await require('../netlify/functions/jobs').handler({body:'{"next_run":"test"}'});
 assert.equal(result.statusCode,200);assert.equal(calls,0);}
 finally{process.env=previous;c.rpc=rpc;c.db=db;}
});
test('rappel e-mail dépassé : aucun envoi fournisseur',async()=>{
 const db=c.db;let calls=0;c.db=async()=>{calls++;return [{revision:1,status:'confirme',starts:'2000-01-01T10:00:00Z'}];};
 try{assert.deepEqual(await n.deliver({kind:'email-reminder',payload:{revision:1}}),{obsolete:true});assert.equal(calls,1);}
 finally{c.db=db;}
});
