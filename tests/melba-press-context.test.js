// Non-régression : « un kit press nails complet uniquement » puis « Matin » (bug constaté sur téléphone).
// Attendu : la prestation est reconnue dans le catalogue réel, conservée d'un message à l'autre,
// Melba ne redemande ni la prestation ni la préférence déjà données, et ne crée aucune réservation.
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=process.env.BR_PRESS_ROOT||require('path').resolve(__dirname,'..');
const chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');
const CATALOGUE=require(root+'/site/assets/prestations.json').services;

const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin,db:c.db,fetch:globalThis.fetch};
let claudeCalls=[];
function mock(){
 b.availability=async()=>[];
 c.rpc=async(name)=>name==='limit'?true:name==='quote'?{services:[],minutes:30,cents:2500}:null;
 c.rate=async()=>{};c.origin=()=>{};c.db=async()=>[];
 claudeCalls=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('api.anthropic.com')){
   claudeCalls.push(JSON.parse(opts.body));
   return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'Très bien. Quelle date vous conviendrait ?'}]})};
  }
  throw new Error('appel réseau inattendu : '+url);
 };
}
function restore(){b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.origin=saved.origin;c.db=saved.db;globalThis.fetch=saved.fetch;}

async function ask(messages,bookingContext){
 const body={messages,selected_service_ids:[]};
 if(bookingContext){body.bookingContext=bookingContext;body.contextSignature=c.sign('melba-context:'+JSON.stringify(bookingContext));}
 const res=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body)});
 return {status:res.statusCode,...JSON.parse(res.body)};
}
const user=content=>({role:'user',content});
const melba=content=>({role:'assistant',content,signature:c.sign('melba-reply:'+content)});

test('Press on nails : « kit press nails complet uniquement » reconnu dans le catalogue réel',()=>{
 const m=require(root+'/netlify/functions/lib/melba-policy').matchServices('Bonjour je veux réserver pour un kit press nails complet uniquement',CATALOGUE);
 assert.deepEqual(m.ids,['press-kit-seul']);
 assert.equal(m.ambiguous,null);
});

test('Scénario téléphone : prestation puis « Matin » sans redemander la prestation',async()=>{
 mock();
 try{
  // Tour 1 : la prestation est nommée, la préférence et la date manquent.
  const r1=await ask([user('Bonjour je veux réserver pour un kit press nails complet uniquement')]);
  assert.equal(r1.status,200);
  assert.equal(claudeCalls.length,0,'réponse serveur directe, pas d’appel au modèle');
  assert.match(r1.reply,/Kit complet uniquement/);
  assert.match(r1.reply,/Quelle date/);
  assert.doesNotMatch(r1.reply,/prestation.*souhait|quelles prestations/i);
  assert.deepEqual(r1.bookingContext.services,['press-kit-seul']);

  // Tour 2 : « Matin » ; la prestation vient du contexte signé, pas d’une nouvelle question.
  const h2=[user('Bonjour je veux réserver pour un kit press nails complet uniquement'),melba(r1.reply),user('Matin')];
  const r2=await ask(h2,r1.bookingContext);
  assert.equal(r2.status,200);
  assert.equal(claudeCalls.length,0);
  assert.match(r2.reply,/le matin/);
  assert.match(r2.reply,/Quelle date/);
  assert.doesNotMatch(r2.reply,/prestation|famille|Kit complet \+/i,'pas de nouvelle question sur la prestation');
  assert.equal(r2.bookingContext.preference,'morning');
  assert.deepEqual(r2.bookingContext.services,['press-kit-seul']);
  assert.equal(r2.pendingBooking,null);
 }finally{restore();}
});

test('Date donnée ensuite : le modèle reçoit la prestation identifiée, sans la redemander',async()=>{
 mock();
 try{
  const ctx={date:null,preference:'morning',services:['press-kit-seul']};
  const h=[user('Bonjour je veux réserver pour un kit press nails complet uniquement'),melba('Très bien.'),user('Matin'),melba('Très bien, le matin. Quelle date vous conviendrait ?'),user('lundi 26 octobre')];
  const r=await ask(h,ctx);
  assert.equal(r.status,200);
  assert.equal(claudeCalls.length,1,'la date déclenche la recherche réelle via le modèle');
  const system=claudeCalls[0].system;
  assert.match(system,/Prestations déjà identifiées dans la conversation \(ne les redemande pas\) : press-kit-seul/);
  assert.deepEqual(r.bookingContext.services,['press-kit-seul']);
  assert.equal(r.bookingContext.preference,'morning');
 }finally{restore();}
});

test('Nom ambigu (« kit complet ») : seule la précision est demandée',async()=>{
 mock();
 try{
  const r=await ask([user('je veux un kit complet')]);
  assert.match(r.reply,/Plusieurs prestations/);
  assert.match(r.reply,/Kit complet uniquement/);
  assert.match(r.reply,/Kit complet \+ prise de mesure/);
  assert.equal(claudeCalls.length,0);
  assert.equal(r.pendingBooking,null);
 }finally{restore();}
});

test('Aucune réservation créée par ces parcours',async()=>{
 mock();
 try{
  const r=await ask([user('Bonjour je veux réserver pour un kit press nails complet uniquement'),user('Matin')]);
  assert.equal(r.pendingBooking,null);
  assert.doesNotMatch(r.reply,/rendez-vous est (confirmé|enregistré)\b(?! n’est)/i);
 }finally{restore();}
});
