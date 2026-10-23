// Couverture du catalogue complet de Melba : les 64 prestations, les familles, les multi-sélections,
// le parcours déterministe dans l'ordre, les deux modes, le rafraîchissement et la protection des données.
// Gestionnaire HTTP réel, catalogue réel (site/assets/prestations.json), calendrier et tarifs simulés.
// Aucune écriture : rpc 'book' et envoi réel interdits. Modèle simulé : jamais appelé pour le parcours.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
process.env.BOOKING_SIGNING_KEY='catalogue-signing-only';process.env.TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');process.env.ANTHROPIC_API_KEY='catalogue-no-model';
const root=process.env.BR_PARCOURS_ROOT||path.resolve(__dirname,'..');
const c=require(root+'/netlify/functions/lib/core'),b=require(root+'/netlify/functions/lib/booking'),chat=require(root+'/netlify/functions/chat');
const policy=require(root+'/netlify/functions/lib/melba-policy'),resolveDate=policy.requestedDate;
policy.requestedDate=(messages,now)=>resolveDate(messages,now||new Date('2026-10-23T12:00:00Z'));policy.today=()=>'2026-10-23';
const RAW=require(root+'/site/assets/prestations.json').services;
const catalogue=RAW.map((s,i)=>{const[h,m]=s.dur.split('h').map(Number);return {id:s.id,name:s.name,path:s.path,minutes:h*60+m,cents:s.price*100,active:true,position:i};});
const DAY='2026-11-03';
const famOf=s=>String(s.path).split('›').slice(0,-1).map(x=>x.trim()).pop();
const saved={db:c.db,rpc:c.rpc,rate:c.rate,origin:c.origin,availability:b.availability,fetch:globalThis.fetch};
let rpcLog=[],modelCalls=0,advisorBodies=[];
function setup(){rpcLog=[];modelCalls=0;advisorBodies=[];
 c.db=async p=>/br15_services/.test(p)?catalogue:[];
 c.rpc=async(name,a)=>{rpcLog.push(name);if(name==='limit')return true;if(name==='quote'){const sel=catalogue.filter(s=>a.p_ids.includes(s.id));return {services:a.p_ids,minutes:sel.reduce((t,s)=>t+s.minutes,0),cents:sel.reduce((t,s)=>t+s.cents,0)};}return null;};
 c.rate=async()=>{};c.origin=()=>{};
 // Créneaux simulés (heure de Paris 9h00, 10h40, 11h15) : mêmes décalages UTC que le calendrier réel.
 b.availability=async()=>['08:00','09:40','10:15'].map(t=>({starts:DAY+'T'+t+':00Z'}));
 globalThis.fetch=async(url,opts)=>{const body=JSON.parse(opts.body);if(!body.tools)advisorBodies.push(body);modelCalls++;return{ok:true,status:200,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:body.tools?'Quelle prestation souhaitez-vous réserver ?':'Pour l’entretien, limez doucement et hydratez la cuticule.'}]})};};
}
function restore(){Object.assign(c,{db:saved.db,rpc:saved.rpc,rate:saved.rate,origin:saved.origin});b.availability=saved.availability;globalThis.fetch=saved.fetch;}
function client(selected=[]){let state=null,cookie='',h=[];return {get state(){return state},get cookie(){return cookie},get history(){return h},get rpc(){return rpcLog},refresh(){h=h.filter(m=>!m.private);},async ask(text){h.push({role:'user',content:text});const r=await chat.handler({httpMethod:'POST',headers:{cookie},body:JSON.stringify({flow_version:2,messages:h,bookingContext:state?.bookingContext,contextSignature:state?.contextSignature,selected_service_ids:selected})});const d=JSON.parse(r.body);if(r.headers?.['Set-Cookie'])cookie=r.headers['Set-Cookie'].split(';')[0];if(d.private)h.at(-1).private=true;if(d.reply)h.push({role:'assistant',content:d.reply,signature:d.signature,private:d.private});state=d;return {status:r.statusCode,...d};}};}

// 1. Catalogue : chaque feuille de catalogue.js correspond à prestations.json (64 entrées, aucune anomalie).
test('Catalogue : 64 prestations, arborescence du crâne identique à prestations.json',()=>{
 const sb={window:{}};vm.createContext(sb);vm.runInContext(fs.readFileSync(root+'/site/catalogue.js','utf8'),sb);
 const leaves=[];(function walk(n,trail){const t=[...trail,n.name];if(n.children&&n.children.length)n.children.forEach(ch=>walk(ch,t));else leaves.push({id:n.id,name:n.name,path:t.slice(1).join(' › '),dur:n.dur,price:n.price});})(sb.window.BR_TREE,[]);
 assert.equal(leaves.length,64);assert.equal(RAW.length,64);
 const byId=new Map(RAW.map(s=>[s.id,s]));
 for(const l of leaves){const j=byId.get(l.id);assert.ok(j,'absent : '+l.id);assert.equal(j.name,l.name,l.id);assert.equal(j.dur,l.dur,l.id);assert.equal(j.price,l.price,l.id);assert.equal(j.path.replace(/\s*›\s*/g,' › '),l.path,l.id);}
});

// 2. Chaque prestation est reconnue par « famille + nom » : parcours HTTP réel, date demandée ensuite, sans question répétée.
for(const[id,phrase] of catalogue.map(s=>[s.id,famOf(s)+' '+s.name]))test('Prestation '+id+' reconnue par « '+phrase+' » : date demandée, durée et tarif exacts',async()=>{
 setup();try{
  const x=client();await x.ask('Je veux réserver');
  const r=await x.ask(phrase);
  assert.deepEqual(x.state.bookingContext.services,[id],'prestation enregistrée');
  assert.equal(r.flowStep,'date');assert.match(r.reply,/Quelle date/);assert.doesNotMatch(r.reply,/Quelle prestation/);
  const s=catalogue.find(z=>z.id===id);assert.match(r.reply,new RegExp(String(s.minutes)+' min'));
  assert.equal(modelCalls,0,'aucun appel au modèle pour une prestation du catalogue');
 }finally{restore();}
});

// 3. Familles : le nom de famille seul ouvre une précision, puis chaque choix successif est retenu.
const families=[...new Set(catalogue.map(famOf))];
for(const fam of families)test('Famille « '+fam+' » : précision, puis choix successif retenu sans nouvelle question',async()=>{
 setup();try{
  const members=catalogue.filter(s=>famOf(s)===fam);
  const x=client();await x.ask('Je veux réserver');
  const r=await x.ask(fam);
  assert.deepEqual(x.state.bookingContext.services||[],[],'aucune prestation retenue sans précision');
  assert.doesNotMatch(r.reply,/Quelle prestation/,'pas de question de prestation répétée');
  assert.match(r.reply,/quelle option|Plusieurs prestations/);
  const pick=members[members.length-1];
  const r2=await x.ask(pick.name);
  assert.deepEqual(x.state.bookingContext.services,[pick.id],'choix retenu dans la famille');
  assert.equal(r2.flowStep,'date');
  assert.equal(modelCalls,0);
 }finally{restore();}
});

// 4. Prestations multiples : durées et tarifs cumulés, toutes les prestations passent au calendrier.
test('Prestations multiples du crâne : durées et prix cumulés, une seule question date',async()=>{
 setup();try{
  const pair=[catalogue[0].id,catalogue[1].id,catalogue[40].id];
  const sel=catalogue.filter(s=>pair.includes(s.id));
  const x=client(pair);const r=await x.ask('Je veux réserver ma sélection');
  assert.deepEqual(x.state.bookingContext.services.sort(),[...pair].sort());
  const minutes=sel.reduce((t,s)=>t+s.minutes,0),euros=(sel.reduce((t,s)=>t+s.cents,0)/100).toLocaleString('fr-FR');
  assert.match(r.reply,new RegExp(minutes+' min'));assert.match(r.reply,new RegExp(euros.replace(/ | /g,'.?')));
  assert.equal(r.flowStep,'date');
 }finally{restore();}
});

// 5. Parcours complet dans l'ordre : prestation, date, période, horaire, nom, prénom, e-mail, téléphone, récapitulatif, aucune écriture.
test('Parcours complet dans l’ordre strict, une question à la fois, récapitulatif sans écriture',async()=>{
 setup();try{
  const x=client();
  const steps=[['Je veux réserver un kit press nails complet uniquement','date'],[DAY,'period'],['Matin','time'],['10h40','surname'],['dupont','firstname'],['élise','email'],['fictive@example.invalid','phone'],['0600000000',null]];
  let r;for(const[t,expect] of steps){r=await x.ask(t);if(expect)assert.equal(r.flowStep,expect,'après « '+t+' »');if(t===DAY)assert.doesNotMatch(r.reply,/, [A-ZÉÈ]/,'pas de majuscule parasite après la date');}
  assert.ok(r.pendingBooking,'récapitulatif prêt');assert.equal(r.pendingBooking.client_name,'dupont élise');
  assert.match(r.reply,/Voici votre récapitulatif/);
  assert.ok(!rpcLog.includes('book'),'aucune réservation écrite avant le clic Confirmer');
  assert.equal(modelCalls,0);
 }finally{restore();}
});

// 6. Rafraîchissement : les champs déjà validés sont restaurés par le cookie chiffré, rien n'est redemandé.
test('Rafraîchissement pendant les coordonnées : aucune donnée redemandée',async()=>{
 setup();try{
  const x=client();
  for(const t of ['Je veux réserver un kit press nails complet uniquement',DAY,'Matin','10h40','dupont']) await x.ask(t);
  x.refresh();
  const r=await x.ask('élise');assert.equal(r.flowStep,'email');assert.doesNotMatch(r.reply,/nom de famille|prénom/);
  x.refresh();const r2=await x.ask('fictive@example.invalid');assert.equal(r2.flowStep,'phone');
  x.refresh();const r3=await x.ask('0600000000');assert.equal(r3.pendingBooking.client_name,'dupont élise');
 }finally{restore();}
});

// 7. Données personnelles : jamais dans le contexte signé ni dans les réponses hors récapitulatif.
test('Données personnelles protégées : absentes du contexte signé et des réponses intermédiaires',async()=>{
 setup();try{
  const x=client();
  const r0=await (async()=>{for(const t of ['Je veux réserver un kit press nails complet uniquement',DAY,'Matin','10h40','dupont']) await x.ask(t);return null;})();
  const bc=JSON.stringify(x.state.bookingContext||{});
  assert.ok(!bc.includes('dupont'),'nom absent du contexte signé');
  assert.ok(!JSON.stringify(x.history.filter(m=>!m.private)).includes('dupont'),'nom absent de l’historique persistant');
  assert.match(x.cookie,/^br15_melba_flow=/,'coordonnées dans un cookie chiffré');
  assert.ok(!decodeURIComponent(x.cookie).includes('dupont'),'cookie chiffré');
 }finally{restore();}
});

// 8. Modes : accueil, conseil sans outil, retour en réservation, réservation conservée pendant le conseil.
test('Deux modes : accueil, conseil sans outil, réservation conservée et reprise',async()=>{
 setup();try{
  const x=client();
  const hello=await x.ask('Bonjour');assert.equal(hello.reply,'Bonjour ! Vous avez besoin d’un conseil ou vous souhaitez réserver ? ♡');
  await x.ask('Je veux réserver un kit press nails complet uniquement');await x.ask(DAY);
  const adv=await x.ask('Un conseil pour l’entretien ?');
  assert.match(adv.reply,/^Je passe en mode conseillère\. /);
  assert.equal(advisorBodies.length,1);assert.equal(advisorBodies[0].tools,undefined,'mode conseil : aucun outil');
  assert.match(advisorBodies[0].system,/Mode conseillère/);
  const kept=await x.ask('Matin');assert.match(kept.reply,/réservation en cours est conservée/);
  assert.deepEqual(x.state.bookingContext.services,['press-kit-seul'],'la prestation survit au mode conseil');
  const back=await x.ask('Je veux réserver');assert.match(back.reply,/^Je passe en mode agent de réservation\. /);
  assert.match(back.reply,/Souhaitez-vous le matin|matin ou l’après-midi/);
  assert.ok(!rpcLog.includes('book'));
 }finally{restore();}
});

// 9. Plafond IA : même la salutation est refusée quand le plafond est atteint ; aucun appel fournisseur.
test('Plafond IA épuisé : refus avant tout appel fournisseur',async()=>{
 setup();const real=c.rpc;try{
  c.rpc=async n=>n==='limit'?false:null;
  const r=await chat.handler({httpMethod:'POST',headers:{},body:JSON.stringify({flow_version:2,messages:[{role:'user',content:'Bonjour'}]})});
  assert.equal(r.statusCode,429);assert.equal(modelCalls,0);
 }finally{c.rpc=real;restore();}
});

// 10. Site et PWA : cache renouvelé à cette livraison, fichiers du parcours présents dans la coque, API jamais mise en cache.
test('Site et PWA : cache renouvelé, coque complète, appels /.netlify/ jamais mis en cache',()=>{
 const sw=fs.readFileSync(root+'/site/sw.js','utf8');
 assert.match(sw,/const CACHE='br-v15-20261024-catalogue-complet'/,'nom de cache renouvelé');
 for(const f of ['./assistant.js','./melba-session.js','./catalogue.js']) assert.ok(sw.includes("'"+f+"'"),'coque : '+f);
 assert.match(sw,/pathname\.startsWith\('\/\.netlify\/'\)/,'les fonctions ne sont jamais mises en cache');
 for(const f of ['assistant.js','melba-session.js','catalogue.js']) assert.ok(fs.existsSync(root+'/site/'+f),'fichier présent : '+f);
});
