const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../netlify/functions/lib/melba-policy'),chat=require('../netlify/functions/chat'),c=require('../netlify/functions/lib/core'),b=require('../netlify/functions/lib/booking');
const users=(...content)=>content.map(content=>({role:'user',content}));
const now=new Date('2026-10-23T10:00:00Z');
test('dates sans année : prochaine occurrence, année explicite, dates impossibles et Paris',()=>{
 assert.equal(p.requestedDate(users('le 26 octobre'),now),'2026-10-26');assert.match(p.label('2026-10-26'),/^lundi/);
 assert.equal(p.requestedDate(users('le 20 octobre'),now),'2027-10-20');
 assert.equal(p.requestedDate(users('le 20 octobre 2026'),now),'2026-10-20');
 assert.equal(p.requestedDate(users('demain'),now),'2026-10-24');assert.equal(p.requestedDate(users('après-demain'),now),'2026-10-25');assert.equal(p.requestedDate(users('le 31 février'),now),null);assert.equal(p.requestedDate(users('29 février'),now),'2028-02-29');
 assert.equal(p.today(new Date('2026-10-23T22:30:00Z')),'2026-10-24');
 assert.equal(p.requestedDate(users('le 26 octobre','plutôt le matin'),now),'2026-10-26');
});
test('préférence déjà donnée, changement de préférence, midi et créneaux espacés',()=>{
 assert.equal(p.preference(users('le matin','le 26 octobre')),'morning');assert.equal(p.preference(users('matin','finalement après-midi')),'afternoon');assert.equal(p.preference(users('à 12h00')),'afternoon');
 const slots=Array.from({length:48},(_,i)=>({starts:new Date(Date.UTC(2026,9,26,8,i*5)).toISOString()}));
 const chosen=p.choose(slots,'morning');assert.equal(chosen.length,4);assert(chosen.every(s=>+p.time(s.starts).slice(0,2)<12));assert(+new Date(chosen.at(-1).starts)-+new Date(chosen[0].starts)>60*60000);
});
test('abandon ne prétend pas annuler ; vraie annulation exige un lien sécurisé',()=>{
 for(const t of ['Je change d’avis','Finalement je laisse tomber','merci, au revoir','stop']){const reply=p.directReply(t);assert.match(reply,/Pas de souci/);assert.doesNotMatch(reply,/annul|technique|horaire/);}
 assert.match(p.directReply('Je veux annuler mon rendez-vous'),/lien sécurisé/);assert.equal(p.directReply('Je souhaite réserver'),null);assert.equal(p.directReply('Je change d’avis car votre horaire est incorrect, une erreur'),null);
});
test('garde-fous : heures inventées et confirmations bloquées, panne fermée, texte chaleureux conservé',()=>{
 assert.match(p.guardedReply('Je suis disponible à 13h30',{}),/vérifier le calendrier/);
 assert.match(p.guardedReply('Votre rendez-vous est confirmé !',{}),/vérifier le calendrier/);
 assert.match(p.guardedReply('13h est libre',{toolError:true}),/ne peux pas vérifier/);
 assert.equal(p.guardedReply('Avec plaisir 💕',{}),'Avec plaisir 💕');
 const ctx={availability:{date:'2026-10-26',total_minutes:105,available_starts:['10:00','11:00']}};assert.match(p.guardedReply('17h est libre',ctx),/10:00, 11:00/);assert.doesNotMatch(p.guardedReply('17h est libre',ctx),/17/);
});
async function fixture(run){const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,db:c.db,fetch:global.fetch,env:{...process.env}};try{c.rpc=async()=>({minutes:105,cents:5400});await run();}finally{b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.db=saved.db;global.fetch=saved.fetch;process.env=saved.env;}}
test('outil : toutes les prestations, date corrigée, préférence et durée cumulée',()=>fixture(async()=>{
 let calls=[];b.availability=async(date,ids)=>{calls.push([date,ids]);return [{starts:'2030-10-26T08:00:00Z'},{starts:'2030-10-26T13:00:00Z'}]};
 const context={requestedDate:'2030-10-26',dateSource:'latest',preference:'morning'};
 const out=await chat._test.nativeRunTool('check_availability',{date:'2025-10-26',service_ids:['a','b']},context);
 assert.deepEqual(calls,[['2030-10-26',['a','b']]]);assert.equal(out.total_minutes,105);assert.deepEqual(out.available_starts,['10:00']);
 calls=[];const noPreference=await chat._test.nativeRunTool('check_availability',{date:'2030-10-26',service_ids:['a','b']},{});assert(noPreference.requires_preference);assert.equal(calls.length,0);
}));
test('outil : date passée refusée ; dimanche vide => alternative vraiment vérifiée',()=>fixture(async()=>{
 b.availability=async()=>{throw Error('must not call')};const past=await chat._test.nativeRunTool('check_availability',{date:'2020-01-01',service_ids:['a']},{preference:'any'});assert(past.past);
 const calls=[];b.availability=async date=>{calls.push(date);return date==='2030-10-28'?[{starts:'2030-10-28T09:00:00Z'}]:[]};
 const out=await chat._test.nativeRunTool('check_availability',{date:'2030-10-27',service_ids:['a','b']},{preference:'morning'});assert(out.alternative);assert.equal(out.date,'2030-10-28');assert.deepEqual(calls,['2030-10-27','2030-10-28']);
}));
test('proposition revérifiée : créneau occupé refusé, aucune écriture ni confirmation automatique',()=>fixture(async()=>{
 b.availability=async()=>[];const ctx={preference:'morning'};let r=await chat._test.nativeRunTool('book_appointment',{date:'2030-10-26',start:'10:00',service_ids:['a','b']},ctx);assert.equal(r.ok,false);assert.equal(ctx.pending,undefined);
 b.availability=async()=>[{starts:'2030-10-26T08:00:00Z'}];r=await chat._test.nativeRunTool('book_appointment',{date:'2030-10-26',start:'10:00',service_ids:['a','b']},ctx);assert(r.requires_confirmation);assert.equal(ctx.pending.quote.minutes,105);assert.match(p.guardedReply('Confirmé',ctx),/Aucun rendez-vous n’est encore enregistré/);
}));
test('handler : panne outil => jamais de créneau inventé ni de données écrites',()=>fixture(async()=>{
 process.env.BOOKING_SIGNING_KEY='test-only';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};c.rpc=async()=>true;c.db=async()=>[];b.availability=async()=>{throw Error('unavailable')};let calls=0;
 global.fetch=async()=>({ok:true,json:async()=>++calls===1?{stop_reason:'tool_use',content:[{type:'tool_use',id:'t1',name:'check_availability',input:{date:'2030-10-26',service_ids:['a']}}]}:{stop_reason:'end_turn',content:[{type:'text',text:'13h est disponible.'}]}});
 const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:users('le 26 octobre 2030 après-midi')})});assert.equal(r.statusCode,200);const d=JSON.parse(r.body);assert.match(d.reply,/ne peux pas vérifier/);assert.equal(d.pendingBooking,null);assert.doesNotMatch(d.reply,/13h/);
}));
test('abandon : handler sans appel IA et sans notification, vraie annulation sans action métier',()=>fixture(async()=>{
 process.env.BOOKING_SIGNING_KEY='test-only';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};global.fetch=async()=>{throw Error('network forbidden')};
 for(const text of ['Je change d’avis','Je veux annuler mon rendez-vous']){const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:users(text)})});assert.equal(r.statusCode,200);const d=JSON.parse(r.body);assert.equal(d.pendingBooking,null);assert(p.directReply(text)===d.reply);}
}));
test('contexte signé : alternative retenue, préférence conservée, contexte falsifié ignoré',()=>fixture(async()=>{
 process.env.BOOKING_SIGNING_KEY='test-only';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};c.rpc=async()=>({minutes:105,cents:5400});c.db=async()=>[];
 const checks=[];b.availability=async(date,ids)=>{checks.push(date);return [{starts:date+'T09:00:00Z'}]};let count=0;
 global.fetch=async()=>({ok:true,json:async()=>++count%2?{stop_reason:'tool_use',content:[{type:'tool_use',id:'t1',name:'check_availability',input:{date:'2030-10-28',service_ids:['a','b']}}]}:{stop_reason:'end_turn',content:[{type:'text',text:'Disponible'}]}});
 const bookingContext={date:'2030-10-28',preference:'morning'},contextSignature=c.sign('melba-context:'+JSON.stringify(bookingContext));
 const messages=users('le 27 octobre 2030 matin','oui cet autre jour');
 let r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages,bookingContext,contextSignature})});let d=JSON.parse(r.body);assert.equal(checks[0],'2030-10-28');assert.equal(d.bookingContext.date,'2030-10-28');assert.equal(d.contextSignature,c.sign('melba-context:'+JSON.stringify(d.bookingContext)));
 checks.length=0;r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages,bookingContext:{...bookingContext,date:'2030-11-01'},contextSignature})});assert.equal(checks[0],'2030-10-27');
}));
