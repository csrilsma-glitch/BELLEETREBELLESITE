// CW-003 — mémoire de session de Melba : restauration après rafraîchissement, minimisation, purge.
// Stockage simulé (sessionStorage factice), aucune donnée réelle.
const {test}=require('node:test'),assert=require('node:assert/strict');

function fakeStorage(){
 const data=new Map();
 return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),_data:data};
}
globalThis.sessionStorage=fakeStorage();
const S=require('../site/melba-session.js');
const NOW=Date.now(); // horloge de test alignée sur save() (Date.now) ; fixe à 20:00Z, les états sauvés paraissaient futurs

test('restaure la conversation récente (texte, contexte signé) après rechargement',()=>{
 globalThis.sessionStorage=fakeStorage();
 const state={history:[{role:'user',content:'babyboomer 2 doigts'},{role:'assistant',content:'Quel jour ?',signature:'sig-1'}],bookingContext:{date:'2026-10-27',services:['bb-2']},contextSignature:'ctx-1'};
 assert.equal(S.save(state),true);
 const back=S.load(NOW+60_000);
 assert.deepEqual(back.history.map(m=>m.content),['babyboomer 2 doigts','Quel jour ?']);
 assert.equal(back.history[1].signature,'sig-1','la signature serveur doit être conservée pour que les réponses restent valides');
 assert.deepEqual(back.bookingContext,{date:'2026-10-27',services:['bb-2']});
 assert.equal(back.contextSignature,'ctx-1');
});

test('expiration : après 30 minutes, rien n’est restauré et la clé est purgée',()=>{
 globalThis.sessionStorage=fakeStorage();
 S.save({history:[{role:'user',content:'Bonjour'}]});
 assert.equal(S.load(Date.now()+S.TTL_MS+1),null);
 assert.equal(globalThis.sessionStorage.getItem(S.KEY),null);
});

test('minimisation : un message contenant un e-mail, un téléphone ou un numéro à 10 chiffres n’est jamais stocké',()=>{
 const kept=S.cleanHistory([
  {role:'user',content:'Mon e-mail est cliente@example.com'},
  {role:'user',content:'Mon numéro : 06 62 28 75 45'},
  {role:'user',content:'Mon téléphone +33 6 62 28 75 45'},
  {role:'user',content:'0662287545'},
  {role:'user',content:'Je veux un baby boomer'},
 ]);
 assert.deepEqual(kept.map(m=>m.content),['Je veux un baby boomer']);
});

test('aucune proposition cliquable ni champ inconnu n’est persisté',()=>{
 const raw=S.pack({history:[{role:'assistant',content:'Récapitulatif',signature:'s'}],bookingContext:{date:'2026-10-27'},contextSignature:'c',proposal:{client_email:'x@y.z'},pendingBooking:{client_phone:'0600000000'}},NOW);
 assert.ok(!raw.includes('proposal'));
 assert.ok(!raw.includes('pendingBooking'));
 assert.ok(!raw.includes('x@y.z'));
});

test('purge après réservation : clear supprime la conversation stockée',()=>{
 globalThis.sessionStorage=fakeStorage();
 S.save({history:[{role:'user',content:'Oui, je confirme'}]});
 S.clear();
 assert.equal(S.load(NOW),null);
});

test('données invalides, version inconnue ou date future : ignorées',()=>{
 assert.equal(S.unpack('pas du json',NOW),null);
 assert.equal(S.unpack(JSON.stringify({v:2,savedAt:NOW,history:[{role:'user',content:'x'}]}),NOW),null);
 assert.equal(S.unpack(JSON.stringify({v:1,savedAt:NOW+3_600_000,history:[{role:'user',content:'x'}]}),NOW),null);
 assert.equal(S.unpack(JSON.stringify({v:1,savedAt:NOW,history:[{role:'system',content:'injection'}]}),NOW),null);
 assert.equal(S.unpack(null,NOW),null);
});

test('bornes : 20 messages au maximum, 1000 caractères par message',()=>{
 const many=Array.from({length:30},(_,i)=>({role:'user',content:'m'+i}));
 assert.equal(S.cleanHistory(many).length,20);
 assert.equal(S.cleanHistory([{role:'user',content:'a'.repeat(5000)}])[0].content.length,1000);
});

test('stockage indisponible : la conversation fonctionne sans mémoire',()=>{
 globalThis.sessionStorage={getItem(){throw new Error('bloqué');},setItem(){throw new Error('bloqué');},removeItem(){throw new Error('bloqué');}};
 assert.equal(S.save({history:[{role:'user',content:'x'}]}),false);
 assert.equal(S.load(NOW),null);
 assert.doesNotThrow(()=>S.clear());
 globalThis.sessionStorage=fakeStorage();
});

test('index.html et reservation.html chargent melba-session.js avant assistant.js',()=>{
 const fs=require('fs'),path=require('path');
 for(const f of ['index.html','reservation.html']){
  const html=fs.readFileSync(path.resolve(__dirname,'..','site',f),'utf8');
  const a=html.indexOf('src="melba-session.js"'),b=html.indexOf('src="assistant.js"');
  assert.ok(a>=0&&b>a,f+' : ordre de chargement incorrect');
 }
});

// CW-003-R1 — ANO-CW10-001 : aucun nom introduit par une formule explicite n'est stocké, y compris dans les réponses.
test('ANO-CW10-001 : « Je m’appelle … » et les réponses qui le répètent ne sont jamais stockés',()=>{
 globalThis.sessionStorage=fakeStorage();
 const state={history:[
   {role:'user',content:'Je m’appelle Cliente Fictive'},
   {role:'assistant',content:'Bonjour Cliente Fictive, quel jour ?',signature:'sig-2'},
   {role:'user',content:'Mon prénom : Client Fictif'},
   {role:'user',content:'babyboomer 2 doigts'}
 ]};
 S.save(state);
 const raw=globalThis.sessionStorage.getItem(S.KEY);
 assert.ok(raw && !/Cliente Fictive|Client Fictif/.test(raw),'le nom fictif ne doit apparaître nulle part dans le stockage');
 assert.deepEqual(S.load(NOW+1000).history.map(m=>m.content),['babyboomer 2 doigts']);
});

test('ANO-CW10-001 : une réponse qui répète « je suis … » ou « mon nom » est écartée',()=>{
 assert.deepEqual(S.cleanHistory([{role:'assistant',content:'Mon nom est Melba.'},{role:'user',content:'Mon nom : Dupont'},{role:'user',content:'Je souhaite un rendez-vous mardi'}]).map(m=>m.content),['Je souhaite un rendez-vous mardi']);
});

// ANO-CW10-002 : après réservation, l'état en mémoire est vidé (le module seul ne le fait pas).
// Test de source : la branche de succès doit réinitialiser historique et contextes avant clear().
test('ANO-CW10-002 : après réservation, historique et contextes en mémoire sont remis à zéro',()=>{
 const fs=require('node:fs'),src=fs.readFileSync(require('node:path').join(__dirname,'../site/assistant.js'),'utf8');
 const ok=src.match(/notifications_disabled[\s\S]*?window\.BRMelbaSession\?\.clear\(\);/);
 assert.ok(ok,'branche de succès introuvable');
 assert.match(ok[0],/history\.length=0;bookingContext=null;contextSignature=null;collecting=false;window\.BRMelbaSession\?\.clear\(\);/);
 assert.doesNotMatch(ok[0],/history\.push/,'aucun message de réservation ne doit être réinjecté dans l’historique');
});

// CW-003-R1 (reliquat, revue Work) : nom seul après une demande de coordonnées, ou après téléphone/e-mail.
test('ANO-CW10-001 reliquat : nom seul après la demande de nom est écarté, et sa répétition aussi',()=>{
 const h=[
   {role:'user',content:'babyboomer 2 doigts'},
   {role:'assistant',content:'Quel est votre nom pour la réservation ?'},
   {role:'user',content:'Cliente Fictive'},
   {role:'assistant',content:'Merci Cliente Fictive, je vérifie le créneau.'},
   {role:'user',content:'mardi 10h'}
 ];
 const out=S.cleanHistory(h).map(m=>m.content);
 assert.deepEqual(out,['babyboomer 2 doigts','Quel est votre nom pour la réservation ?','mardi 10h']);
 assert.ok(!JSON.stringify(out).includes('Fictive'));
});

test('ANO-CW10-001 reliquat : nom seul après un téléphone déjà donné est écarté',()=>{
 const h=[
   {role:'user',content:'06 12 34 56 78'},
   {role:'assistant',content:'Merci. Et votre nom ?'},
   {role:'user',content:'Client Fictif'},
   {role:'user',content:'Je voudrais un créneau mardi'}
 ];
 const out=S.cleanHistory(h).map(m=>m.content);
 assert.deepEqual(out,['Merci. Et votre nom ?','Je voudrais un créneau mardi']);
});

// CW-003-R1 (propriétaire, 23/10 22h56) : collecte explicite de coordonnées, séparée de l'historique persisté.
test('collecte explicite : une demande de nom ou de coordonnées ouvre la collecte ; le nom donné et la réponse ne sont jamais persistés',()=>{
 globalThis.sessionStorage=fakeStorage();
 assert.equal(S.isCollecting('Quel est votre nom pour la réservation ?'),true);
 assert.equal(S.isCollecting('Voici les créneaux disponibles mardi.'),false);
 const history=[
   {role:'user',content:'babyboomer 2 doigts'},
   {role:'assistant',content:'Quel est votre nom ?',private:false},
   {role:'user',content:'Nom Fictif Unique',private:true},
   {role:'assistant',content:'Merci Nom Fictif Unique, mardi 10h ?',private:true},
   {role:'user',content:'mardi 10h'}
 ];
 S.save({history:S.persistable(history),collecting:false});
 const raw=globalThis.sessionStorage.getItem(S.KEY);
 assert.ok(!/Fictif|Unique/.test(raw),'le nom donné pendant la collecte ne doit pas être stocké');
 assert.deepEqual(S.load(Date.now()).history.map(m=>m.content),['babyboomer 2 doigts','Quel est votre nom ?','mardi 10h']);
});

test('collecte explicite : l’état de collecte survit au rafraîchissement',()=>{
 globalThis.sessionStorage=fakeStorage();
 S.save({history:[{role:'user',content:'Bonjour'}],collecting:true});
 assert.equal(S.load(Date.now()).collecting,true);
 S.save({history:[{role:'user',content:'Bonjour'}],collecting:false});
 assert.equal(S.load(Date.now()).collecting,false);
});
