const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core'),chat=require('../netlify/functions/chat');
test('Melba reçoit les règles métier sans perdre sa personnalité ni ses outils',async()=>{
 const saved={rate:c.rate,db:c.db,fetch:global.fetch,env:{...process.env}};
 process.env.ANTHROPIC_API_KEY='fictif';process.env.NATIVE_BOOKING_ENABLED='true';c.rate=async()=>{};c.db=async()=>[];
 global.fetch=async(url,opt)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');const d=JSON.parse(opt.body);assert(d.system.startsWith(chat._test.SYSTEM_PROMPT));assert(d.system.includes('aucun acompte ni paiement en ligne'));assert(d.system.includes('y compris lors de la première visite'));assert.deepEqual(d.tools,chat._test.TOOLS);return {ok:true,json:async()=>({content:[{type:'text',text:'Sans acompte ♡'}],stop_reason:'end_turn'})};};
 try{const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:[{role:'user',content:'Un acompte ?'}]})});assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).reply,'Sans acompte ♡');}finally{c.rate=saved.rate;c.db=saved.db;global.fetch=saved.fetch;process.env=saved.env;}
});
