// Parcours complet Melba, par le gestionnaire HTTP réel, avec calendrier simulé et modèle simulé.
// Aucune écriture : les appels de base de données sont enregistrés et seuls les tarifs (quote) sont autorisés.
// Le modèle est simulé ; il ne fait que demander une recherche de disponibilités quand le serveur le lui demande.
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=process.env.BR_PARCOURS_ROOT||require('path').resolve(__dirname,'..');
const chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');

const SERVICE='press-kit-seul';
// Calendrier simulé : mardi 26 et lundi 26 indisponibles le matin (pause du Manager), mardi 27 libre.
const PARIS_SLOTS={'10:00':'09:00','10:40':'09:40','11:15':'10:15','11:55':'10:55'};
const DAY_SLOTS={'2026-10-27':Object.values(PARIS_SLOTS).map(h=>({starts:'2026-10-27T'+h+':00Z'}))};
const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin,db:c.db,fetch:globalThis.fetch};
let rpcCalls,claudeCalls,modelDate;

function mock(){
 rpcCalls=[];claudeCalls=[];modelDate='2026-10-26';
 b.availability=async date=>DAY_SLOTS[date]||[];
 c.rpc=async(name,args)=>{rpcCalls.push(name);return name==='quote'?{services:[],minutes:30,cents:2500}:name==='limit'?true:null;};
 c.rate=async()=>{};c.origin=()=>{};c.db=async()=>[];
 // Modèle simulé : demande une recherche de disponibilités puis résume ce que le serveur a trouvé.
 globalThis.fetch=async(url,opts)=>{
  if(!String(url).includes('api.anthropic.com'))throw new Error('appel réseau inattendu');
  const body=JSON.parse(opts.body);claudeCalls.push(body);
  const last=body.messages.at(-1);
  if(Array.isArray(last.content)&&last.content.some(x=>x.type==='tool_result'))
   return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'Je vous propose ces créneaux.'}]})};
  return {ok:true,status:200,json:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',id:'t1',name:'check_availability',input:{date:modelDate,service_ids:[SERVICE]}}]})};
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
const melba=(r)=>({role:'assistant',content:r.reply,signature:r.signature});

test('Parcours complet : de la demande à la récapitulatif, sans répétition ni confirmation inventée',async()=>{
 mock();
 try{
  // 1. Prestation nommée (faute de frappe incluse).
  const h=[];
  h.push(user('Bonjour, je voudrais prendre rendez-vous pour un kit press nails complet uniquement.'));
  const r1=await ask(h);
  assert.equal(r1.status,200);
  assert.match(r1.reply,/Kit complet uniquement/);
  assert.doesNotMatch(r1.reply,/quelles prestations/i);
  h.push(melba(r1));

  // 2. Date demandée le matin : indisponible, alternative vérifiée (mardi 27).
  h.push(user('Le 26 octobre au matin.'));
  modelDate='2026-10-26';
  const r2=await ask(h,r1.bookingContext);
  assert.equal(r2.status,200);
  assert.match(r2.reply,/27 octobre/);
  assert.match(r2.reply,/10:40/);
  h.push(melba(r2));
  const callsAfterAlternative=claudeCalls.length;

  // 3. Date et heure dans le même message : le créneau est retenu, la liste n’est pas répétée.
  h.push(user('Le 27 octobre à 10h40.'));
  const r3=await ask(h,r2.bookingContext);
  assert.equal(r3.status,200);
  assert.match(r3.reply,/10:40/,'le créneau choisi est confirmé dans la réponse');
  assert.doesNotMatch(r3.reply,/10:00|11:15|11:55/,'la liste ne doit pas être répétée');
  assert.equal(r3.pendingBooking,null,'pas de réservation avant les coordonnées');
  assert.equal(r3.bookingContext.start,'10:40');
  assert.equal(r3.bookingContext.date,'2026-10-27');
  assert.equal(claudeCalls.length,callsAfterAlternative,'choix du créneau traité par le serveur');
  h.push(melba(r3));

  // 4. Coordonnées fournies : le récapitulatif est préparé, aucune confirmation n’est annoncée.
  h.push(user('Nom : Cliente Test\nTéléphone : 0600000000\nE-mail : test@example.com'));
  const r4=await ask(h,r3.bookingContext);
  assert.equal(r4.status,200);
  assert.doesNotMatch(r4.reply,/vérifier le calendrier/i,'pas de refus générique alors que les informations sont là');
  assert.match(r4.reply,/Kit complet uniquement/);
  assert.match(r4.reply,/25/);
  assert.match(r4.reply,/30 min/);
  assert.match(r4.reply,/mardi 27 octobre 2026/);
  assert.match(r4.reply,/10:40/);
  assert.match(r4.reply,/Aucun rendez-vous n’est encore enregistré/);
  assert.ok(r4.pendingBooking,'une proposition à confirmer par clic est créée');
  assert.equal(r4.pendingBooking.client_name,'Cliente Test');
  assert.equal(r4.bookingContext.start,'10:40');
  h.push(melba(r4));

  // 5. Demande de consultation du récapitulatif : même récapitulatif, sans nouvelle question.
  h.push(user('Puis-je consulter le récapitulatif avant de confirmer ?'));
  const r5=await ask(h,r4.bookingContext);
  assert.match(r5.reply,/Kit complet uniquement/);
  assert.match(r5.reply,/10:40/);
  assert.ok(r5.pendingBooking,'le récapitulatif reste à confirmer par clic');
  assert.equal(claudeCalls.length,callsAfterAlternative,'aucun appel de modèle pour le récapitulatif');

  // Garde-fous : aucune écriture, aucune confirmation affirmée.
  assert.deepEqual(rpcCalls.filter(n=>!['quote','limit'].includes(n)),[],'aucune écriture en base');
  for(const r of [r1,r2,r3,r4,r5])assert.doesNotMatch(r.reply,/rendez-vous (est |a été )?(bien )?(confirmé|enregistré)(?! n’est)/i);
 }finally{restore();}
});

// Variantes naturelles : même logique, quelle que soit la formulation.
async function slotAndContext(dateText){
 const h=[user('Bonjour, je voudrais prendre rendez-vous pour un kit press nails complet uniquement.')];
 const r1=await ask(h);h.push(melba(r1));
 h.push(user('Le 26 octobre au matin.'));modelDate='2026-10-26';
 const r2=await ask(h,r1.bookingContext);h.push(melba(r2));
 h.push(user(dateText));
 return {h,r:await ask(h,r2.bookingContext)};
}
for(const phrase of ['Mardi 27 à 10h40','Le 27/10 à 10:40','Le 27 octobre à 10h40 svp']){
 test('Sélection par phrase naturelle : « '+phrase+' »',async()=>{
  mock();
  try{
   const {r}=await slotAndContext(phrase);
   assert.match(r.reply,/10:40/,phrase);
   assert.doesNotMatch(r.reply,/10:00|11:15|11:55/,phrase);
   assert.equal(r.bookingContext.start,'10:40',phrase);
  }finally{restore();}
 });
}

test('Coordonnées données en plusieurs messages : Melba demande seulement ce qui manque',async()=>{
 mock();
 try{
  const {h,r:rSel}=await slotAndContext('Le 27 octobre à 10h40.');
  h.push(melba(rSel));
  h.push(user('Je m’appelle Cliente Test'));
  const r1=await ask(h,rSel.bookingContext);
  assert.match(r1.reply,/téléphone/);assert.doesNotMatch(r1.reply,/nom/);
  assert.equal(r1.pendingBooking,null);
  h.push(melba(r1));
  h.push(user('0600000000'));
  const r2=await ask(h,r1.bookingContext);
  assert.match(r2.reply,/adresse e-mail/);
  assert.equal(r2.pendingBooking,null);
  h.push(melba(r2));
  h.push(user('test@example.com'));
  const r3=await ask(h,r2.bookingContext);
  assert.ok(r3.pendingBooking,'récapitulatif prêt');
  assert.match(r3.reply,/Kit complet uniquement/);
 }finally{restore();}
});

test('« Je confirme » dans le chat : Melba renvoie vers le bouton, sans rien enregistrer',async()=>{
 mock();
 try{
  const {h,r:rSel}=await slotAndContext('Le 27 octobre à 10h40.');
  h.push(melba(rSel));
  h.push(user('Nom : Cliente Test\nTéléphone : 0600000000\nE-mail : test@example.com'));
  const r4=await ask(h,rSel.bookingContext);
  h.push(melba(r4));
  h.push(user('Je confirme'));
  const r5=await ask(h,r4.bookingContext);
  assert.match(r5.reply,/bouton Confirmer/);
  assert.equal(r5.pendingBooking,null);
  assert.deepEqual(rpcCalls.filter(n=>n==='book'),[],'aucune réservation créée par le chat');
 }finally{restore();}
});
