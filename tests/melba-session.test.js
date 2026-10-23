// CW-003 — mémoire de session de Melba : restauration après rafraîchissement, minimisation, purge.
// Stockage simulé (sessionStorage factice), aucune donnée réelle.
const {test}=require('node:test'),assert=require('node:assert/strict');

function fakeStorage(){
 const data=new Map();
 return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),_data:data};
}
globalThis.sessionStorage=fakeStorage();
const S=require('../site/melba-session.js');
const NOW=Date.parse('2026-10-23T20:00:00Z');

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
 assert.equal(S.load(NOW+S.TTL_MS+1),null);
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
