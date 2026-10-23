const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../netlify/functions/lib/melba-policy'),chat=require('../netlify/functions/chat'),c=require('../netlify/functions/lib/core'),b=require('../netlify/functions/lib/booking');
const user=t=>[{role:'user',content:t}],now=new Date('2026-10-23T10:00:00Z');
const unverified={openingQuestion:false,availability:null,pending:null,requestedDate:null};
test('HTN-ERR-066 : chaque contournement publié par Claude est neutralisé sans outil',()=>{
 const phrases=['Parfait, je vous réserve neuf heures mardi.','Il reste une place à midi demain.','Votre créneau est bon, je vous attends mardi.','Je vous propose une place à neuf heures.','Vous êtes inscrite pour mardi, à bientôt.','C’est fait, votre rendez-vous est enregistré.'];
 for(const reply of phrases){const out=p.guardedReply(reply,{...unverified});assert.notEqual(out,reply,reply);assert.match(out,/vérifier le calendrier/);}
 for(const hour of ['une heure','deux heures','trois heures','quatre heures','cinq heures','six heures','sept heures','huit heures','neuf heures','dix heures','onze heures','douze heures','midi','minuit','vingt et une heures','9h','09:30'])assert(p.needsCalendarEvidence('À '+hour+', c’est bon.'),hour);
 for(const day of ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'])assert(p.needsCalendarEvidence('Je vous attends '+day));
 assert.equal(p.guardedReply('Avec plaisir, le paiement se fait sur place 💕',{}),'Avec plaisir, le paiement se fait sur place 💕');
});
test('HTN-ERR-066 : seuls les résultats structurés autorisent des horaires ; paramètres connus non redemandés',()=>{
 const context={siteSelection:['gel'],requestedDate:'2030-10-28',preference:'morning'};
 const denied=p.guardedReply('Il reste une place à midi',context);assert.doesNotMatch(denied,/quelle date|quelles prestations|préférez/);
 const verified=p.guardedReply('Je vous réserve neuf heures', {...context,availability:{date:'2030-10-28',total_minutes:105,available_starts:['10:00']}});assert.match(verified,/10:00/);assert.doesNotMatch(verified,/neuf heures/);
});
test('HTN-ERR-067 : abandon seul, demande mixte, changement de date et plainte réelle distingués',()=>{
 for(const t of ["je change d'avis, plutôt demain matin","annule mon rendez-vous et réserve plutôt le 10 novembre","je laisse tomber mais je veux connaître vos tarifs","stop et demain ?","je change d’avis car votre horaire est incorrect, une erreur"]){assert.equal(p.directReply(t),null,t);}
 for(const t of ["non merci, je change d'avis","je change d’avis","finalement je laisse tomber","merci, au revoir","stop","Je laisse tomber, merci !"]){assert.match(p.directReply(t),/Pas de souci/,t);}
 assert.match(p.directReply('Je veux annuler mon rendez-vous'),/lien sécurisé/);
});
test('HTN-ERR-068 : dernier jour exprimé, jour prochain et passage année/mois/Paris',()=>{
 assert.equal(p.requestedDate(user('jeudi matin'),now),'2026-10-29');
 assert.equal(p.requestedDate(user('vendredi prochain'),now),'2026-10-30');
 assert.equal(p.requestedDate([...user('demain'),...user('plutôt lundi')],now),'2026-10-26');
 assert.equal(p.requestedDate(user('demain, mais plutôt jeudi'),now),'2026-10-29');
 assert.equal(p.requestedDate(user('jeudi, mais plutôt demain'),now),'2026-10-24');
 assert.equal(p.requestedDate(user('lundi prochain'),new Date('2026-10-26T10:00Z')),'2026-11-02');
 assert.equal(p.requestedDate(user('vendredi'),new Date('2026-12-31T10:00Z')),'2027-01-01');
 assert.equal(p.requestedDate(user('dimanche'),new Date('2026-10-24T22:30Z')),'2026-11-01');
 assert.equal(p.requestedDate(user('lundi 26 octobre'),now),'2026-10-26');
});
test('HTN-ERR-069 : durée ne fixe pas le matin, préposition horaire explicite requise',()=>{
 for(const t of ['je voudrais 1h30 de soin','une prestation de 1h30 de soin','la durée est 14h00 de travail','1h30','10h30'])assert.equal(p.preference(user(t)),null,t);
 for(const t of ['à 10h30','vers 09:30','entre 10h et 11h','de 10h à 11h'])assert.equal(p.preference(user(t)),'morning',t);
 assert.equal(p.preference(user('à 14h30')),'afternoon');assert.equal(p.preference(user('le matin')),'morning');assert.equal(p.preference(user('après-midi')),'afternoon');
});
async function fixture(fn){const saved={availability:b.availability,rpc:c.rpc,rate:c.rate,db:c.db,fetch:global.fetch,env:{...process.env}};try{c.rpc=async()=>({services:[],minutes:105,cents:5400});await fn();}finally{b.availability=saved.availability;c.rpc=saved.rpc;c.rate=saved.rate;c.db=saved.db;global.fetch=saved.fetch;process.env=saved.env;}}
test('HTN-ERR-068 : une ancienne date non qualifiée ne remplace plus la nouvelle date outil',()=>fixture(async()=>{
 const calls=[];b.availability=async date=>{calls.push(date);return [{starts:date+'T09:00Z'}]};
 await chat._test.nativeRunTool('check_availability',{date:'2030-11-01',service_ids:['a','b']},{requestedDate:'2030-10-24',preference:'morning'});
 assert.equal(calls[0],'2030-11-01');
 const ctx={requestedDate:'2030-11-01',dateSource:'latest',preference:'morning'};
 await chat._test.nativeRunTool('book_appointment',{date:'2030-10-24',start:'10:00',service_ids:['a','b']},ctx);assert.equal(calls.at(-1),'2030-11-01');assert.equal(ctx.pending.starts,'2030-11-01T09:00Z');
}));
test('HTN-ERR-070 : aucune préférence = aucun appel ; date + trois alternatives maximum',()=>fixture(async()=>{
 const calls=[];b.availability=async date=>{calls.push(date);return []};
 const input={date:'2030-10-24',service_ids:['a','b']};await chat._test.nativeRunTool('check_availability',input,{});assert.equal(calls.length,0);
 const ctx={preference:'afternoon'};await chat._test.nativeRunTool('check_availability',input,ctx);
 assert.deepEqual(calls,['2030-10-24','2030-10-25','2030-10-26','2030-10-27']);
 await assert.rejects(chat._test.nativeRunTool('check_availability',input,ctx),e=>e.status===429);assert.equal(calls.length,4);
}));
test('HTN-ERR-070 : budget partagé entre outils, jamais de création après épuisement',()=>fixture(async()=>{
 let calls=0;b.availability=async date=>{calls++;return [{starts:date+'T09:00Z'}]};
 const ctx={preference:'morning'},input={date:'2030-10-28',service_ids:['a','b']};
 for(let i=0;i<4;i++)await chat._test.nativeRunTool('check_availability',input,ctx);
 await assert.rejects(chat._test.nativeRunTool('book_appointment',{...input,start:'10:00'},ctx),e=>e.status===429);assert.equal(calls,4);assert.equal(ctx.pending,undefined);
}));
test('handler : lendemain signé puis nouveau jour = le jour du dernier message prévaut',()=>fixture(async()=>{
 process.env.BOOKING_SIGNING_KEY='counteraudit-test';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};c.db=async()=>[];let step=0,seen;
 b.availability=async date=>{seen=date;return [{starts:date+'T09:00Z'}]};
 global.fetch=async()=>({ok:true,json:async()=>++step===1?{stop_reason:'tool_use',content:[{type:'tool_use',id:'t',name:'check_availability',input:{date:'2099-12-01',service_ids:['a','b']}}]}:{stop_reason:'end_turn',content:[{type:'text',text:'Je vous réserve neuf heures.'}]}});
 const ctx={date:'2030-10-24',preference:'morning'},signature=c.sign('melba-context:'+JSON.stringify(ctx));
 const messages=[...user('demain'),...user('je change d’avis, plutôt jeudi matin')];
 const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages,bookingContext:ctx,contextSignature:signature})});assert.equal(r.statusCode,200);assert.equal(seen,p.requestedDate([messages.at(-1)]));assert.doesNotMatch(JSON.parse(r.body).reply,/Pas de souci|neuf heures/);
}));
test('HTN-ERR-068 : une date invalide explicite ne retombe pas sur une date mémorisée',()=>fixture(async()=>{
 process.env.BOOKING_SIGNING_KEY='counteraudit-test';process.env.ANTHROPIC_API_KEY='fake';c.rate=async()=>{};c.db=async()=>[];let calls=0,step=0;
 b.availability=async()=>{calls++;throw Error('must not read calendar')};
 global.fetch=async()=>({ok:true,json:async()=>++step===1?{stop_reason:'tool_use',content:[{type:'tool_use',id:'t',name:'check_availability',input:{date:'2030-03-01',service_ids:['a']}}]}:{stop_reason:'end_turn',content:[{type:'text',text:'Je vous attends mardi.'}]}});
 const ctx={date:'2030-10-24',preference:'morning'},signature=c.sign('melba-context:'+JSON.stringify(ctx));
 const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({messages:user('le 30 février 2030'),bookingContext:ctx,contextSignature:signature})});assert.equal(r.statusCode,200);assert.equal(calls,0);const result=JSON.parse(r.body);assert.match(result.reply,/date n’est pas valide/);assert.equal(result.pendingBooking,null);
}));
