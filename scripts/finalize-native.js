/* À lancer localement UNIQUEMENT après recette et validation humaine de migration. */
const fs=require('node:fs');
if(!process.argv.includes('--validated')){console.error('Recette native et validation de migration requises. Lire README_V15.md.');process.exit(1);}
const p='netlify/functions/chat.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("const { startTimesFor, bookOne } = require('./simplybook');",'// SimplyBook retiré après validation de migration.');
const start=s.indexOf('async function legacyRunTool('),end=s.indexOf('// V15 :',start);
if(start>=0&&end>=0)s=s.slice(0,start)+s.slice(end);
s=s.replace("process.env.NATIVE_BOOKING_ENABLED === 'true' ? await nativeRunTool(block.name, block.input,context) : await legacyRunTool(block.name, block.input)","await nativeRunTool(block.name, block.input,context)");
// La fonction sequenceStarts n’est plus utilisée ; supprimer sa dépendance ancienne.
const a=s.indexOf('async function sequenceStarts('),b=s.indexOf('async function sendMailToMelanie(',a);if(a>=0&&b>=0)s=s.slice(0,a)+s.slice(b);
s=s.replaceAll('calendrier SimplyBook','calendrier natif');fs.writeFileSync(p,s);
for(const f of ['netlify/functions/simplybook.js','site/reservation-legacy.html','site/reservation-legacy.js'])if(fs.existsSync(f))fs.unlinkSync(f);
const rp='site/reservation.js';let r=fs.readFileSync(rp,'utf8');r=r.replace("const a=document.createElement('a');a.href='reservation-legacy.html'+location.search;a.textContent='Accéder au calendrier précédent pendant la transition';status.append(document.createElement('br'),a);",'');fs.writeFileSync(rp,r);
console.log('Retrait local effectué. Exécuter npm run check, npm test, npm run test:sql. Aucune publication réalisée.');
