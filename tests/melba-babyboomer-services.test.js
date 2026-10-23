// Régression 23 octobre : « babyboomer 2 doigts » devait être reconnu, sinon « 10h40 » relançait la liste des horaires.
// Calendrier et modèle simulés ; aucune écriture (les appels de base sont enregistrés, rien n'est réservé).
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=require('path').resolve(__dirname,'..');
const chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking'),policy=require(root+'/netlify/functions/lib/melba-policy');
const CATALOGUE=require(root+'/site/assets/prestations.json').services;
const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin,db:c.db,fetch:globalThis.fetch};
const DAY={'2026-10-27':['09:00','09:40','10:15','10:55'].map(h=>({starts:'2026-10-27T'+h+':00Z'}))};

function mock(){
 const writes=[];
 b.availability=async d=>DAY[d]||[];
 c.rpc=async(n,args)=>{if(n==='quote')return {services:[],minutes:10,cents:700};if(n==='limit')return true;writes.push(n);return null;};
 c.rate=async()=>{};c.origin=()=>{};c.db=async()=>[];
 globalThis.fetch=async(url,opts)=>{
  if(!String(url).includes('api.anthropic.com'))throw new Error('appel réseau inattendu');
  const last=JSON.parse(opts.body).messages.at(-1);
  if(Array.isArray(last.content)&&last.content.some(x=>x.type==='tool_result'))
   return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'Je vous propose ces créneaux.'}]})};
  return {ok:true,status:200,json:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',id:'t1',name:'check_availability',input:{date:'2026-10-27',service_ids:['bb-2']}}]})};
 };
 return writes;
}
function restore(){b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.origin=saved.origin;c.db=saved.db;globalThis.fetch=saved.fetch;}

test('reconnaissance : « babyboomer 2 doigts » et variantes désignent bb-2 sans ambiguïté',()=>{
 for(const t of ['Bonjour, je voudrais un rendez-vous pour une déco babyboomer 2 doigts','Le baby boomer 2 doigts','babyboomer 2 doigts'])
  assert.deepEqual(policy.matchServices(t,CATALOGUE).ids,['bb-2'],t);
 assert.deepEqual(policy.matchServices('Incrustation complète 2 doigts',CATALOGUE).ids,['inc-2']);
 assert.deepEqual(policy.matchServices('bonjour je veux un rendez-vous',CATALOGUE).ids,[]);
});

test('parcours : après « 10h40 », Melba confirme le choix et ne relance pas la liste des horaires',async()=>{
 const writes=mock();
 try{
  const history=[];let bc=null,cs=null,replies=[];
  for(const t of ['Bonjour, je voudrais un rendez-vous pour une déco babyboomer 2 doigts','Le mardi 27 octobre','Matin','10h40']){
   history.push({role:'user',content:t});
   const body={messages:history.slice(-20),selected_service_ids:[]};
   if(bc){body.bookingContext=bc;body.contextSignature=cs;}
   const res=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body)});
   const d=JSON.parse(res.body);replies.push(d.reply);
   if(d.signature)history.push({role:'assistant',content:d.reply,signature:d.signature});
   bc=d.bookingContext||bc;cs=d.contextSignature||cs;
   if(t==='10h40')assert.deepEqual(bc.services,['bb-2'],'la prestation doit rester dans le contexte signé');
  }
  const last=replies.at(-1);
  assert.ok(!/Lequel préférez-vous/.test(last),'la liste des horaires ne doit pas être répétée');
  assert.match(last,/10:40|10h40/,'le créneau choisi doit être reconnu');
  assert.match(last,/7 €|7€|10 min/,'tarif et durée doivent rester ceux de la prestation');
  assert.deepEqual(writes,[],'aucune écriture avant la validation de la cliente');
 }finally{restore();}
});
