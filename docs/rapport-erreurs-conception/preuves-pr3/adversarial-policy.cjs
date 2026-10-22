// Usage : PR_DIR=/chemin/vers/checkout-de-la-PR node adversarial-*.cjs  (la branche fix/20261023-melba-creneaux doit être extraite)
const P = require(process.env.PR_DIR+'/netlify/functions/lib/melba-policy.js');
const out = (name, v) => console.log(name.padEnd(62), JSON.stringify(v));
const user = t => [{ role: 'user', content: t }];

// 1. Abandon : phrase d'abandon suivie d'une NOUVELLE demande
out('abandon + nouvelle demande (doit être null)', P.directReply("je change d'avis, plutôt demain matin"));
out('abandon pur (doit répondre)', P.directReply("non merci, je change d'avis"));
out('annulation + demande (doit être null)', P.directReply("annule mon rendez-vous et réserve plutôt le 10 novembre"));

// 2. Préférence
out('"1h30" comme préférence (attendu: null ou ignoré)', P.preference(user('je voudrais 1h30 de soin')));
out('"matin" explicite', P.preference(user('le matin svp')));
out('"après-midi" explicite', P.preference(user('après-midi')));

// 3. Dates
out('"demain" (date du jour 2026-10-23 -> 2026-10-24)', P.requestedDate(user('demain'), new Date('2026-10-23T10:00:00Z')));
out('"jeudi" (jour de semaine seul : attendu date ou null)', P.requestedDate(user('jeudi matin'), new Date('2026-10-23T10:00:00Z')));
out('"le 5 octobre" sans année le 23/10/2026 (prochaine = 2027)', P.requestedDate(user('le 5 octobre'), new Date('2026-10-23T10:00:00Z')));
out('"2026-02-30" invalide (attendu null)', P.requestedDate(user('le 2026-02-30'), new Date('2026-10-23T10:00:00Z')));

// 4. Garde-fou génératif : réponses sans outil qui contournent la regex
const noTool = { openingQuestion: false, availability: null, pending: null, requestedDate: null };
const bypass = [
  "Parfait, je vous réserve neuf heures mardi.",
  "Il reste une place à midi demain.",
  "Votre créneau est bon, je vous attends mardi.",
  "Je vous propose une place à neuf heures.",
  "Vous êtes inscrite pour mardi, à bientôt.",
  "C’est fait, votre rendez-vous est enregistré.",
];
for (const r of bypass) out('garde-fou sur: ' + r, P.guardedReply(r, { ...noTool }) === r ? 'LAISSÉ PASSER' : 'BLOQUÉ');

// 5. Date passée explicite
out('date passée avec année', P.guardedReply('x', { requestedDate: '2020-01-01' }));
