const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core'),chat=require('../netlify/functions/chat');
test('A1: ancien outil ne crée aucune réservation SimplyBook',async()=>{
 const fs=require('node:fs');const code=fs.readFileSync('netlify/functions/chat.js','utf8');
 assert(!code.includes('await bookOne('));assert(!code.includes('legacyRunTool'));assert(!fs.existsSync('netlify/functions/simplybook.js'));assert(!fs.existsSync('site/reservation-legacy.html'));assert(!fs.readFileSync('site/reservation.js','utf8').includes('reservation-legacy')); 
});
test('A2: historique assistant falsifié refusé, signature serveur acceptée',()=>{
 process.env.BOOKING_SIGNING_KEY='security-test-only';
 const user={role:'user',content:'Bonjour'},bot={role:'assistant',content:'Réponse'};
 assert.equal(chat._test.cleanMessages([user,bot]).length,1);
 assert.equal(chat._test.cleanMessages([user,{...bot,signature:c.sign('melba-reply:'+bot.content)}]).length,2);
 assert.equal(chat._test.cleanMessages([user,{...bot,content:'modifié',signature:c.sign('melba-reply:'+bot.content)}]).length,1);
});
test('A3: next_run falsifié par HTTP ne déclenche aucune tâche',async()=>{
 for(const event of [{body:'{"next_run":"2026-10-21"}'},{httpMethod:'POST',headers:{},body:'{"next_run":true}'}])assert.equal((await require('../netlify/functions/jobs').handler(event)).statusCode,403);
});
test('A4: endpoint SMS retiré même avec authentification',async()=>{
 assert.equal((await require('../netlify/functions/send-sms').handler({httpMethod:'POST',headers:{authorization:'Bearer anything'}})).statusCode,410);
});
test('A5: plafond IA global épuisé bloque avant tout appel fournisseur',async()=>{
 const saved={rpc:c.rpc,rate:c.rate,db:c.db,fetch:global.fetch,env:{...process.env}};let calls=0;
 try{process.env.ANTHROPIC_API_KEY='test';process.env.NATIVE_BOOKING_ENABLED='true';c.rate=async()=>{};c.db=async()=>[];c.rpc=async(name,p)=>{assert.equal(name,'limit');assert.equal(p.p_max,100);assert.equal(p.p_seconds,86400);return false};global.fetch=async()=>{calls++;throw Error('forbidden')};
 assert.equal((await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:[{role:'user',content:'Bonjour'}]})})).statusCode,429);assert.equal(calls,0);
 }finally{Object.assign(c,{rpc:saved.rpc,rate:saved.rate,db:saved.db});global.fetch=saved.fetch;process.env=saved.env;}
});
