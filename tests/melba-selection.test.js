// Non-régression : la cliente répond « 10h40 » à une liste de créneaux (bug constaté sur téléphone).
// Attendu : Melba reconnaît le choix, vérifie le créneau dans le calendrier, demande ses coordonnées,
// ne répète pas la liste, et n'annonce aucun rendez-vous confirmé avant le clic de confirmation.
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
process.env.ANTHROPIC_API_KEY=process.env.ANTHROPIC_API_KEY||'test-not-called';
const root=process.env.BR_SELECTION_ROOT||require('path').resolve(__dirname,'..');
const p=require(root+'/netlify/functions/lib/melba-policy'),chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');

// Créneaux simulés du lundi 26 octobre 2026 (Paris = UTC+1 après le changement d'heure).
const DAY='2026-10-26',SERVICES=['gel-gainage'];
const SLOT_ISO={'09:00':'2026-10-26T08:00:00Z','10:00':'2026-10-26T09:00:00Z','10:40':'2026-10-26T09:40:00Z','11:15':'2026-10-26T10:15:00Z','11:55':'2026-10-26T10:55:00Z'};
const offered=[];
const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,origin:c.origin};
function mockCalendar(){
 b.availability=async(date)=>{offered.push(date);return date===DAY?Object.values(SLOT_ISO).map(starts=>({starts})):[];};
 c.rpc=async(name)=>name==='quote'?{services:[],minutes:60,cents:5000}:name==='limit'?true:null;
 c.rate=async()=>{};c.origin=()=>{};
}
function restore(){b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.origin=saved.origin;}

// Appel HTTP réel du gestionnaire, avec le contexte signé que le site renvoie à chaque tour.
async function ask(messages,bookingContext){
 const body={messages,selected_service_ids:SERVICES};
 if(bookingContext){body.bookingContext=bookingContext;body.contextSignature=c.sign('melba-context:'+JSON.stringify(bookingContext));}
 const res=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body)});
 return {status:res.statusCode,...JSON.parse(res.body)};
}
const user=content=>({role:'user',content});
const melba=content=>({role:'assistant',content,signature:c.sign('melba-reply:'+content)});

test('Régression « 10h40 » : choix d’un créneau proposé, sans répéter la liste',async()=>{
 mockCalendar();
 try{
  // Tour 1 : la cliente a demandé le lundi 26 le matin ; Melba a affiché la liste.
  const listReply='Pour le lundi 26 octobre 2026, les créneaux vérifiés sont : 10:00, 10:40, 11:15, 11:55. Lequel préférez-vous ? ♡';
  const ctx1={date:DAY,preference:'morning'};
  const history=[user('lundi 26 octobre, le matin'),melba(listReply),user('10h40')];

  // Tour 2 : « 10h40 » est reconnu ; réponse serveur sur ce créneau, sans appel à Claude.
  const r=await ask(history,ctx1);
  assert.equal(r.status,200);
  assert.match(r.reply,/10:40/);
  assert.doesNotMatch(r.reply,/10:00|11:15|11:55/,'la liste ne doit pas être répétée');
  assert.match(r.reply,/nom, votre numéro de téléphone et votre adresse e-mail/);
  assert.match(r.reply,/Aucun rendez-vous n’est encore enregistré/);
  assert.equal(r.pendingBooking,null,'aucune proposition de réservation avant les coordonnées');
  assert.equal(r.bookingContext.date,DAY);
  assert.equal(r.bookingContext.start,'10:40');
  assert.equal(r.bookingContext.preference,'morning');
  assert.ok(offered.includes(DAY),'la disponibilité réelle est revérifiée');

  // Tour 3 : la cliente donne ses coordonnées. Le créneau retenu est conservé dans le contexte.
  const history2=[...history,melba(r.reply),user('Marie Martin, 06 12 34 56 78, marie.martin@example.com')];
  const ctx3=require(root+'/netlify/functions/lib/melba-policy').planningContext(history2,r.bookingContext);
  assert.equal(ctx3.requestedDate,DAY,'la date est reprise du contexte signé');
  assert.equal(ctx3.preference,'morning');
  const ctx3Full={...ctx3,siteSelection:SERVICES,selectedStart:r.bookingContext.start,pending:null};
  const out=await chat._test.nativeRunTool('book_appointment',{date:DAY,start:'10:40',service_ids:SERVICES,client_name:'Marie Martin',client_phone:'06 12 34 56 78',client_email:'marie.martin@example.com'},ctx3Full);
  assert.equal(out.requires_confirmation,true,'la réservation demande le clic de confirmation');
  assert.ok(ctx3Full.pending,'une proposition est préparée');
  assert.equal(ctx3Full.pending.starts,SLOT_ISO['10:40']);
 }finally{restore();}
});

test('« celui de 10h40 », « 10:40 » et « 10h40 svp » sont reconnus comme choix',async()=>{
 mockCalendar();
 try{
  for(const text of ['celui de 10h40','10:40','10h40 svp']){
   const r=await ask([user('lundi 26 octobre'),melba('liste des créneaux'),user(text)],{date:DAY,preference:'morning'});
   assert.equal(r.bookingContext.start,'10:40',text);
   assert.match(r.reply,/10:40/,text);
  }
 }finally{restore();}
});

test('Créneau absent du calendrier : message clair, aucune réservation',async()=>{
 mockCalendar();
 try{
  const r=await ask([user('lundi 26 octobre'),melba('liste des créneaux'),user('09h30')],{date:DAY,preference:'morning'});
  assert.match(r.reply,/n’est plus disponible/);
  assert.equal(r.bookingContext.start,undefined);
  assert.equal(r.pendingBooking,null);
 }finally{restore();}
});

test('Une durée seule (« 1h30 ») n’est jamais prise pour un créneau',()=>{
 assert.equal(p.selectedTime('1h30'),null);
 assert.equal(p.selectedTime('un soin de 1h30'),null);
 assert.equal(p.selectedTime('1h30 de soin'),null);
});
