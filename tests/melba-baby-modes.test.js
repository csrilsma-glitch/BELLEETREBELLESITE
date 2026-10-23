// Non-régression « Baby boomer » (la prestation est reconnue, la date suit) et modes conseil / réservation.
// Gestionnaire HTTP réel, calendrier et modèle simulés. Aucune réservation écrite (rpc 'book' interdit).
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=process.env.BR_PARCOURS_ROOT||require('path').resolve(__dirname,'..');
const chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');
const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin,db:c.db,fetch:globalThis.fetch};
let rpcCalls,claudeCalls,modelText;

function mock(){
 rpcCalls=[];claudeCalls=[];modelText='Je vous conseille le modèle qui correspond à votre style.';
 b.availability=async date=>date==='2026-10-26'?[{starts:'2026-10-26T09:40:00Z'}]:[];
 c.rpc=async(name)=>{rpcCalls.push(name);return name==='limit'?true:name==='quote'?{services:[],minutes:40,cents:2100}:null;};
 c.rate=async()=>{};c.origin=()=>{};c.db=async()=>[];
 globalThis.fetch=async(url,opts)=>{
  if(!String(url).includes('api.anthropic.com'))throw new Error('appel réseau inattendu');
  const body=JSON.parse(opts.body);claudeCalls.push(body);
  return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:body.system.includes('Mode conseillère')?modelText:'Quelle prestation souhaitez-vous réserver ?'}]})};
 };
}
function restore(){b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.origin=saved.origin;c.db=saved.db;globalThis.fetch=saved.fetch;}

// Conversation pilotée : chaque réponse est renvoyée avec sa signature et le contexte signé.
function session(){
 const messages=[];let bc=null;
 return {
  async say(text){
   messages.push({role:'user',content:text});
   const body={messages,selected_service_ids:[]};
   if(bc){body.bookingContext=bc;body.contextSignature=c.sign('melba-context:'+JSON.stringify(bc));}
   const res=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body)});
   const r=JSON.parse(res.body);
   assert.equal(res.statusCode,200,res.body);
   messages.push({role:'assistant',content:r.reply,signature:r.signature});
   if(r.bookingContext)bc=r.bookingContext;
   return r;
  },
  get context(){return bc;}
 };
}

test('Baby boomer : la prestation est retenue, puis Melba demande la date (sans redemander la prestation)',async()=>{
 mock();
 try{
  const s=session();
  const r1=await s.say('Je veux réserver');
  assert.match(r1.reply,/Quelle prestation/);
  const base=claudeCalls.length;
  const r2=await s.say('Baby boomer');
  assert.match(r2.reply,/Babyboomer \/ babycolor/);
  assert.match(r2.reply,/Deux doigts/);
  assert.match(r2.reply,/Mains complètes/);
  assert.equal(claudeCalls.length,base,'la précision de famille est déterministe : aucun appel au modèle');
  const r3=await s.say('Quatre doigts');
  assert.match(r3.reply,/Quelle date/);
  assert.doesNotMatch(r3.reply,/Quelle prestation/);
  assert.deepEqual(s.context.services,['bb-4'],'la prestation est enregistrée dans le contexte signé');
  assert.equal(claudeCalls.length,base);
  const r4=await s.say('Le 26 octobre');
  assert.doesNotMatch(r4.reply,/Quelle prestation/);
  assert.equal(s.context.services[0],'bb-4');
  assert.ok(!rpcCalls.includes('book'),'aucune réservation écrite');
 }finally{restore();}
});

test('Baby boomer avec la prestation complète : reconnue directement',async()=>{
 mock();
 try{
  const r=await session().say('Je veux un babyboomer mains complètes');
  assert.match(r.reply,/Mains complètes|Quelle date/);
  assert.doesNotMatch(r.reply,/Quelle prestation|Plusieurs prestations/);
 }finally{restore();}
});

test('Prestation ambiguë sans nom de famille : la précision reste générale',async()=>{
 mock();
 try{
  const r=await session().say('je veux un kit complet');
  assert.match(r.reply,/Plusieurs prestations/);
  assert.equal(claudeCalls.length,0);
 }finally{restore();}
});

test('Mode : salutation seule, puis choix explicite conseil ou réservation',async()=>{
 mock();
 try{
  const s=session();
  const r1=await s.say('Bonjour');
  assert.equal(r1.reply,'Bonjour ! Vous avez besoin d’un conseil ou vous souhaitez réserver ? ♡');
  assert.equal(claudeCalls.length,0);
  const r2=await s.say('J’ai besoin d’un conseil pour l’entretien de mes ongles');
  assert.match(r2.reply,/^Je passe en mode conseillère\. /);
  assert.equal(s.context.mode,'conseil');
  const call=claudeCalls.at(-1);
  assert.equal(call.tools,undefined,'mode conseil : aucun outil de réservation');
  assert.match(call.system,/Mode conseillère/);
  const r3=await s.say('Je veux réserver');
  assert.match(r3.reply,/^Je passe en mode agent de réservation\. /);
  assert.match(r3.reply,/Quelle prestation/);
  assert.equal(s.context.mode,'reservation');
  assert.ok(!rpcCalls.includes('book'));
 }finally{restore();}
});

test('Mode conseil : aucune réponse de réservation, aucune coordonnée demandée',async()=>{
 mock();
 try{
  const s=session();
  await s.say('Quel conseil me donnez-vous pour une première pose ?');
  const r=await s.say('Mon nom est Cliente Test');
  assert.doesNotMatch(r.reply,/Pour préparer le récapitulatif|Quelle date/);
  assert.equal(s.context.mode,'conseil');
  assert.ok(!rpcCalls.includes('book'));
 }finally{restore();}
});

test('Plafond IA épuisé : même la salutation est refusée',async()=>{
 mock();
 const real=c.rpc;
 try{
  c.rpc=async(name)=>name==='limit'?false:null;
  const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:[{role:'user',content:'Bonjour'}]})});
  assert.equal(r.statusCode,429);
 }finally{c.rpc=real;restore();}
});
