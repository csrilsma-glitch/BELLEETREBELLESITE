// Non-régression : le nom communiqué seul, après les autres coordonnées, déclenche le récapitulatif.
// Gestionnaire HTTP réel, calendrier et modèle simulés. Aucune réservation écrite : rpc 'book' interdit.
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=process.env.BR_PARCOURS_ROOT||require('path').resolve(__dirname,'..');
const chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');

const SERVICE='press-kit-seul';
const DAY_SLOTS={'2026-10-27':['09:00','09:40','10:15','10:55'].map(h=>({starts:'2026-10-27T'+h+':00Z'}))};
const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin,db:c.db,fetch:globalThis.fetch};
let rpcCalls;

function mock(){
 rpcCalls=[];
 b.availability=async date=>DAY_SLOTS[date]||[];
 c.rpc=async(name)=>{rpcCalls.push(name);return name==='quote'?{services:[],minutes:30,cents:2500}:name==='limit'?true:null;};
 c.rate=async()=>{};c.origin=()=>{};c.db=async()=>[];
 globalThis.fetch=async(url,opts)=>{
  if(!String(url).includes('api.anthropic.com'))throw new Error('appel réseau inattendu');
  const body=JSON.parse(opts.body);
  const last=body.messages.at(-1);
  if(Array.isArray(last.content)&&last.content.some(x=>x.type==='tool_result'))
   return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'Je vous propose ces créneaux.'}]})};
  return {ok:true,status:200,json:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',id:'t1',name:'check_availability',input:{date:'2026-10-27',service_ids:[SERVICE]}}]})};
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
const melba=r=>({role:'assistant',content:r.reply,signature:r.signature});

test('Nom seul après téléphone et e-mail : le récapitulatif est proposé, sans réservation',async()=>{
 mock();
 try{
  const h=[user('Bonjour, je voudrais un kit press nails complet uniquement, le 27 octobre à 10h40.')];
  const r1=await ask(h);
  assert.equal(r1.status,200);
  assert.match(r1.reply,/10:40/);
  h.push(melba(r1));

  h.push(user('Téléphone : 0600000000, e-mail : test@example.com'));
  const r2=await ask(h,r1.bookingContext);
  assert.equal(r2.status,200);
  assert.match(r2.reply,/votre nom/,'Melba demande le nom');
  assert.equal(r2.pendingBooking,null);
  h.push(melba(r2));

  h.push(user('RIA HOTANOVA'));
  const r3=await ask(h,r2.bookingContext);
  assert.equal(r3.status,200);
  assert.doesNotMatch(r3.reply,/vérifier le calendrier/,'le nom ne doit pas relancer une vérification');
  assert.match(r3.reply,/RIA HOTANOVA/);
  assert.match(r3.reply,/25/);
  assert.match(r3.reply,/30 min/);
  assert.match(r3.reply,/mardi 27 octobre 2026/);
  assert.match(r3.reply,/10:40/);
  assert.match(r3.reply,/Aucun rendez-vous n’est encore enregistré/);
  assert.notEqual(r3.pendingBooking,null,'récapitulatif en attente de confirmation');
  assert.ok(!rpcCalls.includes('book'),'aucune réservation écrite avant le clic Confirmer');
 }finally{restore();}
});
