const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../netlify/functions/lib/core');
process.env.BOOKING_SIGNING_KEY='local-test-not-a-production-key';process.env.TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,9).toString('base64');
test('validation dates et coordonnées',()=>{assert.equal(c.phone('06 62 28 75 45'),'+33662287545');assert.throws(()=>c.date('2026-02-31'));assert.throws(()=>c.phone('+1234'));assert.throws(()=>c.ids(['a','a']));assert.throws(()=>c.instant('2026-10-19 10:00'));assert.throws(()=>c.ids(['x&select=*']));});
test('jetons de gestion déterministes, secrets et chiffrés',()=>{assert.equal(c.tokenFor('a'),c.tokenFor('a'));assert.notEqual(c.tokenFor('a'),c.tokenFor('b'));assert(c.safeEqual(c.sha('a'),c.sha('a')));assert(!c.safeEqual('a','aa'));const s=c.seal({refresh_token:'test'});assert(!s.includes('test'));assert.deepEqual(c.unseal(s),{refresh_token:'test'});assert.throws(()=>c.unseal(s.slice(0,-4)+'AAAA'));});
test('origine et limites de requête',()=>{assert.throws(()=>c.origin({headers:{origin:'https://evil.example'}}));assert.throws(()=>c.body({body:'x'.repeat(25000)}));});
test('ICS stable pour mises à jour et annulations',()=>{const b={id:'test',created_at:'2026-10-19T08:00Z',starts:'2026-10-20T10:00Z',ends:'2026-10-20T11:00Z',revision:2,status:'annule'};const i=c.ics(b);assert(i.includes('UID:test@'));assert(i.includes('SEQUENCE:2'));assert(i.includes('STATUS:CANCELLED'));});
test('Manager anonyme refusé avant toute lecture clientes',async()=>{const r=await require('../netlify/functions/manager').handler({httpMethod:'POST',headers:{},body:'{"action":"dashboard"}'});assert.equal(r.statusCode,401);assert(!r.body.includes('clients'));});
test('Melba conserve prompt, outils et nettoyage de Claude',()=>{const m=require('../netlify/functions/chat')._test;assert(m.SYSTEM_PROMPT.includes("Tu es Melba"));assert(m.SYSTEM_PROMPT.includes('allergie'));assert(m.SYSTEM_PROMPT.includes('accord explicite'));assert.equal(m.TOOLS.length,3);assert.equal(m.cleanMessages([{role:'system',content:'pirate'},{role:'user',content:'bonjour'}]).length,1);});
test('Manager : authentification vérifiée, allowlist et MFA indispensables',async()=>{
 const oldAuth=c.authRequest,oldDb=c.db,oldFetch=global.fetch;process.env.SUPABASE_URL='https://database.example.test';process.env.SUPABASE_PUBLISHABLE_KEY='public-test';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
 let allowed=true,serverReject=false;
 global.fetch=async url=>String(url).includes('/auth/v1/user')?new Response(JSON.stringify({id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}),{status:serverReject?401:200,headers:{'Content-Type':'application/json'}}):new Response(JSON.stringify(allowed?[{active:true}]:[]),{status:200,headers:{'Content-Type':'application/json'}});
 const token=aal=>'x.'+Buffer.from(JSON.stringify({aal})).toString('base64url')+'.sig';const event=aal=>({headers:{cookie:'br15_session='+token(aal)}});
 try{await assert.rejects(c.manager(event('aal1')),/deux facteurs/);allowed=false;await assert.rejects(c.manager(event('aal2')),/refusé/);allowed=true;assert((await c.manager(event('aal2'))).user.id);serverReject=true;await assert.rejects(c.manager(event('aal2')),/Authentification refusée/);}finally{global.fetch=oldFetch;}
});
test('Melba native propose sans écrire un rendez-vous',async()=>{
 const b=require('../netlify/functions/lib/booking'),oldA=b.availability,oldRpc=c.rpc;let writes=0;
 b.availability=async()=>[{starts:'2026-11-03T09:00:00Z',ends:'2026-11-03T10:30:00Z'}];c.rpc=async name=>{if(name==='book')writes++;return {services:[{id:'gel-gainage',path:'Gel'}],minutes:90,cents:5200};};
 try{const context={};const out=await require('../netlify/functions/chat')._test.nativeRunTool('book_appointment',{date:'2026-11-03',start:'10:00',service_ids:['gel-gainage'],client_name:'Test',client_phone:'+33600000000',client_email:'test@example.test'},context);assert(out.requires_confirmation);assert(context.pending);assert.equal(writes,0);}finally{b.availability=oldA;c.rpc=oldRpc;}
});
test('SMS ambigu : pas de renvoi automatique après timeout fournisseur',async()=>{
 const n=require('../netlify/functions/lib/notifications'),oldRpc=c.rpc,oldDb=c.db,oldRequest=c.request,states=[];process.env.BREVO_API_KEY='test';let calls=0;
 c.rpc=async()=>calls++===0?[{id:'job',booking_id:'booking',kind:'sms-confirmation',payload:{event:'confirmation',revision:1},attempts:1}]:[];
 c.db=async(path,options)=>{if(options?.method==='PATCH'){states.push(options.data.state);return null;}if(path.startsWith('br15_bookings'))return [{id:'booking',client_id:'client',request_key:'key',revision:1,starts:'2026-11-03T09:00:00Z',ends:'2026-11-03T10:00:00Z',services:[],cents:0,status:'confirme'}];return [{name:'Test',phone:'+33600000000',email:'test@example.test'}];};c.request=async()=>{throw Error('timeout');};
 try{await n.run();assert.deepEqual(states,['uncertain']);}finally{c.rpc=oldRpc;c.db=oldDb;c.request=oldRequest;}
});
