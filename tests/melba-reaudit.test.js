const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.BR_REAUDIT_ROOT||path.resolve(__dirname,'..');
const p=require(root+'/netlify/functions/lib/melba-policy'),chat=require(root+'/netlify/functions/chat'),c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking');
const user=content=>({role:'user',content});
test('HTN-ERR-069 : aucune position de durée ne crée une préférence',()=>{
 for(const text of ['un soin de 1h30','je voudrais un soin de 1h30 pour mardi','soin de 2h','une prestation de 1h30','une durée de 1h30','une pose de 1h30','un travail de 2h','1h30 de soin','je voudrais 1h30 de soin','un soin de 1h30, merci','un soin de 1h30 à 15h','une durée estimée à 1h30','pendant 2h','pour un soin de 1h30 avant de partir'])assert.equal(p.preference([user(text)]),null,text);
});
test('HTN-ERR-069 : une vraie heure après la durée reste retenue, jamais la durée',()=>{
 assert.equal(p.preference([user('un soin de 1h30 le matin')]),'morning');
 assert.equal(p.preference([user('un soin de 1h30 après-midi')]),'afternoon');
 assert.equal(p.preference([user('à 10h')]),'morning');assert.equal(p.preference([user('vers 15h')]),'afternoon');
 assert.equal(p.preference([user('soin de 2h, de 10h à 12h')]),'morning');
 assert.equal(p.preference([user('soin de 2h, de 15h à 17h')]),'afternoon');
 assert.equal(p.startHour('soin de 2h, de 10h à 12h'),10);
 assert.equal(p.startHour('soin de 2h, de 15h à 17h'),15);
 assert.equal(p.startHour('soin de 2h de 15h à 17h'),15);
 assert.equal(p.preference([user('à 15h pour un soin de 1h30')]),'afternoon');
 assert.equal(p.preference([user('un soin de 1h30 vers 15h')]),'afternoon');
});
test('HTN-ERR-074 : sept jours le jour même et toutes les transitions de semaine',()=>{
 const names=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
 for(let current=0;current<7;current++){
  const now=new Date(Date.UTC(2026,9,25+current,10));
  for(let requested=0;requested<7;requested++){
   const delta=(requested-current+7)%7||7,expected=new Date(+now+delta*86400000).toISOString().slice(0,10);
   assert.equal(p.requestedDate([user(names[requested])],now),expected,names[current]+' → '+names[requested]);
  }
 }
 assert.equal(p.requestedDate([user('vendredi')],new Date('2026-10-23T10:00Z')),'2026-10-30');
 assert.equal(p.requestedDate([user('vendredi')],new Date('2026-12-25T10:00Z')),'2027-01-01');
 assert.equal(p.requestedDate([user('aujourd’hui, plutôt vendredi')],new Date('2026-10-23T10:00Z')),'2026-10-30');
 assert.equal(p.requestedDate([user('vendredi prochain')],new Date('2026-10-23T10:00Z')),'2026-10-30');
 assert.equal(p.requestedDate([user('aujourd’hui vendredi')],new Date('2026-10-23T10:00Z')),'2026-10-23');
 assert.equal(p.requestedDate([user('le 23 octobre 2026')],new Date('2026-10-23T10:00Z')),'2026-10-23');
});
test('HTN-ERR-066 : confirmations implicites sans écriture réelle neutralisées',()=>{
 for(const text of ["C'est réservé pour vous","Parfait, c'est noté","Parfait, c’est noté, à bientôt !","C’est bien réservé pour vous","C'est bon pour vous","Tout est confirmé","Tout est enregistré","C’est validé","C'est booké","Je l’ai noté","J’ai bien noté","Je vous ai réservé votre place"]){assert.notEqual(p.guardedReply(text,{}),text,text);}
 assert.equal(p.guardedReply('Le paiement se fait sur place. Aucun acompte.',{}),'Le paiement se fait sur place. Aucun acompte.');
 const ctx={availability:{date:'2030-11-01',available_starts:['10:00'],total_minutes:105}};
 assert.match(p.guardedReply("C'est réservé pour vous",ctx),/créneaux vérifiés/);assert.doesNotMatch(p.guardedReply("C'est réservé pour vous",ctx),/C'est réservé/);
 assert.match(p.guardedReply("C'est noté",{pending:{}}),/Aucun rendez-vous n’est encore enregistré/);
});
async function fixture(fn){const saved={rate:c.rate,rpc:c.rpc,db:c.db,availability:b.availability,fetch:global.fetch,Date:global.Date,env:{...process.env}};try{
 const RealDate=global.Date;global.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-23T10:00:00Z']));}static now(){return RealDate.parse('2026-10-23T10:00:00Z');}};
 process.env.BOOKING_SIGNING_KEY='reaudit-test-only';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};c.db=async()=>[];c.rpc=async name=>name==='limit'?true:{minutes:105,cents:5400,services:[]};await fn();
 }finally{c.rate=saved.rate;c.rpc=saved.rpc;c.db=saved.db;b.availability=saved.availability;global.fetch=saved.fetch;global.Date=saved.Date;process.env=saved.env;}}
test('HTN-ERR-068 HTTP réel cas A : demain signé puis plutôt vendredi, dateSource et date serveur',t=>fixture(async()=>{
 const messages=[user('demain matin'),user('plutôt vendredi')];
 const bookingContext={date:'2026-10-24',preference:'morning'},contextSignature=c.sign('melba-context:'+JSON.stringify(bookingContext));
 const calls=[];let step=0;
 b.availability=async(date,ids)=>{calls.push({date,ids});return [{starts:date+'T09:00:00Z'}];};
 global.fetch=async(url,opt)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');const body=JSON.parse(opt.body);assert(body.system.includes('2026-10-23'));return {ok:true,json:async()=>++step===1?{stop_reason:'tool_use',content:[{type:'tool_use',id:'t',name:'check_availability',input:{date:'2026-10-30',service_ids:['gel','deco']}}]}:{stop_reason:'end_turn',content:[{type:'text',text:"C'est réservé pour vous"}]}};};
 const response=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages,bookingContext,contextSignature})});
 assert.equal(response.statusCode,200);assert.deepEqual(calls,[{date:'2026-10-30',ids:['gel','deco']}]);
 const context=p.planningContext(messages,bookingContext);assert.equal(context.dateSource,'latest');assert.equal(context.requestedDate,'2026-10-30');assert.equal(context.preference,'morning');
 const data=JSON.parse(response.body);assert.equal(data.bookingContext.date,'2026-10-30');assert.equal(data.pendingBooking,null);assert.match(data.reply,/vendredi 30 octobre 2026/);assert.doesNotMatch(data.reply,/C'est réservé/);
 t.diagnostic(JSON.stringify({clockParis:p.today(),dateSource:context.dateSource,requestedDate:context.requestedDate,calendarCalls:calls}));
}));
test('HTN-ERR-066 HTTP réel : aucune confirmation libre sans outil ni écriture',()=>fixture(async()=>{
 b.availability=async()=>{throw Error('unexpected')};let writes=0;c.rpc=async name=>{if(name!=='limit')writes++;return true;};
 for(const text of ["C'est réservé pour vous","Parfait, c'est noté"]){global.fetch=async()=>({ok:true,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text}]})});
 const response=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:[user('Bonjour')]})});assert.equal(response.statusCode,200);assert.notEqual(JSON.parse(response.body).reply,text);assert.equal(JSON.parse(response.body).pendingBooking,null);}
 assert.equal(writes,0);
}));
