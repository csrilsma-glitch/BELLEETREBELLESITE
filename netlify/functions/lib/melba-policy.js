// Garde-fous métier : aucune donnée cliente ni secret, aucune écriture.
const ZONE='Europe/Paris';
const months=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const today=(now=new Date())=>new Intl.DateTimeFormat('fr-CA',{timeZone:ZONE}).format(now);
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
// La dernière expression temporelle explicite du dernier message pertinent prime.
function requestedDate(messages,now=new Date()){
 const current=today(now),year=Number(current.slice(0,4));
 const weekdays=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
 for(const m of [...messages].reverse().filter(m=>m.role==='user'&&typeof m.content==='string')){
  const text=norm(m.content),candidates=[];
  for(const match of text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g))candidates.push({index:match.index,date:validDate(match[1])?match[1]:null});
  // Format numérique jj/mm ou jj/mm/aaaa (« 27/10 », « 27/10/2026 »), jamais une heure (« 10:40 »).
  for(const match of text.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/g)){
   const month=Number(match[2]),day=Number(match[1]);let date=null;
   for(let y=match[3]?Number(match[3]):year;y<=(match[3]?Number(match[3]):year+8);y++){
    const candidate=`${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(validDate(candidate)&&(match[3]||candidate>=current)){date=candidate;break;}
   }
   candidates.push({index:match.index,date});
  }
  const named=new RegExp('\\b(\\d{1,2})(?:er)?\\s+('+months.join('|')+')(?:\\s+(\\d{4}))?\\b','g');
  for(const match of text.matchAll(named)){
   const month=months.indexOf(match[2])+1,day=Number(match[1]);let date=null;
   for(let y=match[3]?Number(match[3]):year;y<=(match[3]?Number(match[3]):year+8);y++){
    const candidate=`${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(validDate(candidate)&&(match[3]||candidate>=current)){date=candidate;break;}
   }
   candidates.push({index:match.index,date});
  }
  for(const match of text.matchAll(/\b(apres[- ]?demain|demain|aujourd['’]hui)\b/g)){
   const offset=match[1].startsWith('apres')?2:match[1]==='demain'?1:0,d=new Date(current+'T12:00:00Z');
   d.setUTCDate(d.getUTCDate()+offset);candidates.push({index:match.index,date:d.toISOString().slice(0,10)});
  }
  const dayPattern=new RegExp('\\b('+weekdays.join('|')+')(?:\\s+(prochain|suivant))?\\b','g');
  for(const match of text.matchAll(dayPattern)){
   // Dans « lundi 26 octobre », la date chiffrée qui suit reste prioritaire.
   const d=new Date(current+'T12:00:00Z');let offset=(weekdays.indexOf(match[1])-d.getUTCDay()+7)%7;
   // Un jour seul désigne une occurrence strictement à venir ; aujourd’hui doit être explicite.
   if(!offset&&!/aujourd['’]hui\s*$/.test(text.slice(0,match.index)))offset=7;d.setUTCDate(d.getUTCDate()+offset);
   candidates.push({index:match.index,date:d.toISOString().slice(0,10)});
  }
  if(candidates.length)return candidates.sort((a,b)=>b.index-a.index)[0].date;
 }
 return null;
}
function hasDateExpression(text){return /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b|\b\d{1,2}(?:er)?\s+(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b|\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain)\b|aujourd['’]hui/.test(norm(text));}
// Réponse courte qui désigne un créneau proposé : « 10h40 », « 10:40 », « celui de 10h40 ».
// Une simple durée (« 1h30 ») n'est pas un choix : elle doit contenir la forme HHhMM ou HH:MM complète,
// ou une heure seule précédée d'un mot de choix.
function selectedTime(text){
 const t=norm(text).replace(/[’‘]/g,"'").trim();
 const m=t.match(/^((?:(?:je (?:prends|choisis|veux|voudrais|reserve)|celui de|celle de|ce sera|ca sera|a|vers|pour)\s+)?(?:le\s+)?(?:(?:a|vers)\s+)?)([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?(?:[ ,]*(?:svp|s'il vous plait|merci|ca me va|ok))*[ .!?,]*$/);
 if(!m)return null;
 const prefixed=m[1].trim().length>0,hour=Number(m[2]);
 // Sans mot de choix, seule une heure d'ouverture plausible compte (« 1h30 » seul reste une durée).
 if(!prefixed&&(hour<8||hour>20))return null;
 if(!prefixed&&m[3]===undefined&&!/^[01]?\d\s*h$/.test(t))return null;
 return String(hour).padStart(2,'0')+':'+(m[3]||'00');
}
// Retourne l'heure de départ explicite, jamais une durée de prestation.
function startHour(text){
 const t=norm(text);let durationEnd=0,blockedUntil=0;const hours=/\b(a|vers|entre|de)\s+([01]?\d|2[0-3])\s*(?:h(?:[0-5]\d)?|:[0-5]\d)\b/g;
 for(const match of t.matchAll(hours)){
  if(match.index<blockedUntil)continue;
  const before=t.slice(durationEnd,match.index).split(/[,;.!?]/).at(-1),after=t.slice(match.index+match[0].length);
  const range=after.match(/^\s*(?:a|et|jusqu['’]a)\s+(?:[01]?\d|2[0-3])\s*(?:h(?:[0-5]\d)?|:[0-5]\d)\b/);
  if(/^\s*(?:de\s+)?(?:soin|prestation|duree|travail|pose)\b/.test(after))continue;
  if(match[1]==='de'&&/\b(?:soin|prestation|duree|pose|travail|dure|pendant|durant)\b/.test(before)){durationEnd=match.index+match[0].length;if(range)blockedUntil=durationEnd+range[0].length;continue;}
  if(!range&&/\b(?:duree|dure|pendant|durant)\b/.test(before))continue;
  return Number(match[2]);
 }
 return null;
}
function preference(messages){
 for(const m of [...messages].reverse().filter(m=>m.role==='user'&&typeof m.content==='string')){
  const t=norm(m.content);if(/peu importe|indifferent|n'importe|toute la journee/.test(t))return 'any';
  if(/apres[- ]?midi|soir/.test(t))return 'afternoon';if(/matin/.test(t))return 'morning';
  const hour=startHour(t);if(hour!==null)return hour<12?'morning':'afternoon';
 }
 return null;
}
// Cette fonction est aussi utilisée par handler : les tests peuvent reproduire
// exactement sa sélection de contexte, sans omettre dateSource.
function planningContext(messages,previous,now=new Date()){
 const last=[messages.at(-1)],latestDate=requestedDate(last,now),mentioned=hasDateExpression(last[0].content);
 return {invalidDate:mentioned&&!latestDate,dateSource:mentioned?'latest':previous?.date?'memory':'history',
  requestedDate:mentioned?latestDate:previous?.date||requestedDate(messages,now),
  preference:preference(last)||previous?.preference||preference(messages)};
}
const time=iso=>new Intl.DateTimeFormat('fr-FR',{timeZone:ZONE,hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
const label=date=>new Intl.DateTimeFormat('fr-FR',{timeZone:ZONE,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00Z'));
function choose(slots,period){
 const filtered=slots.filter(s=>period==='any'||(Number(time(s.starts).slice(0,2))<12)===(period==='morning'));
 if(filtered.length<=4)return filtered;
 return [...new Set([0,1,2,3].map(i=>Math.round(i*(filtered.length-1)/3)))].map(i=>filtered[i]);
}
function directReply(text){
 const t=norm(text).trim();
 // Ces raccourcis sont des messages complets, jamais le préfixe d'une nouvelle demande.
 if(/^(?:je (?:veux|souhaite) )?(?:annuler|annule|supprimer|deplacer|modifier)\s+(?:mon|notre|le|un)\s+(?:rendez[- ]?vous|rdv|reservation)(?:\s*(?:svp|s['’]il vous plait|merci))?[ .!?,]*$/.test(t))return 'Pour modifier ou annuler un rendez-vous déjà enregistré, utilisez le lien sécurisé de votre e-mail de confirmation. Si vous ne le retrouvez pas, contactez Mélanie au 06 62 28 75 45. Aucune annulation n’a été effectuée ici.';
 if(/^(?:(?:non|merci|finalement)[ ,!.]*)*(?:je change d['’]avis|j['’]ai change d['’]avis|je laisse tomber|laisse(?:z)? tomber|je ne veux plus reserver|je ne souhaite plus reserver|on arrete|arretons|pas maintenant|au revoir|stop|j['’]abandonne)(?:[ ,!.]*(?:merci|bonne journee|a bientot))?[ ,.!?😊💕♡]*$/.test(t))return 'Pas de souci ! 😊 N’hésitez pas à revenir quand vous voulez, je reste à votre disposition. 💕';
 return null;
}
function needsCalendarEvidence(reply){
 let t=norm(reply).replace(/[’‘]/g,"'").replace(/\bsur place\b/g,'sur le lieu');
 // Une durée de prestation (« le soin dure 1 heure ») n'est pas une heure de rendez-vous.
 t=t.replace(/\b(?:dure|durer|durent|duree|pendant|durant)\s+(?:environ\s+|a peu pres\s+)?(?:\d{1,2}|une?|deux|trois|quatre)\s*(?:h|heures?)?(?:\s*(?:et\s+)?(?:\d{1,2}\s*(?:min\w*)?|demi\w*|quart))?\b/g,' duree ');
 // Pas de déduction de disponibilité depuis du texte libre : heures, jours et assertions métier.
 const hours=/\b(?:[01]?\d|2[0-3])\s*(?:h(?:\s*[0-5]\d)?|:[0-5]\d)\b|\b(?:une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dix[- ]sept|dix[- ]huit|dix[- ]neuf|vingt(?:[- ](?:et[- ])?(?:une?|deux|trois))?|\d{1,2})\s+heures?\b|\b(?:midi|minuit)\b/;
 const days=/\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)s?\b/;
 const claims=/\b(?:disponib\w*|libres?|creneaux?|places?)\b|je (?:vous )?(?:reserve|inscris|attends|accueille|bloque)|vous (?:etes|voila) (?:bien )?(?:inscrit\w*|reserve\w*|attendu\w*)|(?:rendez[- ]?vous|reservation|rdv).{0,60}(?:confirm|enregistr|annul|valid)|(?:confirme|annule|enregistre|valide).{0,40}(?:rendez[- ]?vous|reservation|rdv)/;
 const implicit=/\b(?:c'est|ce sera|cela est|tout est)\s+(?:(?:bien|deja|maintenant|desormais)\s+)*(?:reserve\w*|confirme\w*|enregistre\w*|valide\w*|note\w*|bloque\w*|retenu\w*|booke\w*|fait|bon\b)|\bje (?:vous ai|l'ai) (?:bien )?(?:reserve\w*|confirme\w*|enregistre\w*|note\w*|bloque\w*)/;
 return hours.test(t)||days.test(t)||claims.test(t)||implicit.test(t)||/\bj'ai (?:bien )?(?:note\w*|reserve\w*|confirme\w*|enregistre\w*)/.test(t);
}
function guardedReply(reply,context){
 if(context.invalidDate)return 'Cette date n’est pas valide. Pouvez-vous préciser une date du calendrier ? ♡';
 if(context.openingQuestion&&context.openingHours&&!context.availability&&!context.pending)return 'Les horaires habituels du studio, en heure de Paris, sont : '+context.openingHours+'. Les rendez-vous et absences peuvent réduire les créneaux : leur disponibilité doit être vérifiée dans le calendrier. ♡';
 if(context.pending)return 'Voici votre proposition, à relire ci-dessous. Aucun rendez-vous n’est encore enregistré : cochez la case puis cliquez sur Confirmer si tout vous convient. ♡';
 if(context.bookingRejected&&!context.pending)return 'Ce créneau ne convient plus à votre demande. Je peux rechercher d’autres disponibilités pour vos prestations. Aucun rendez-vous n’a été enregistré. ♡';
 if(context.calendarBudgetReached)return 'J’ai atteint la limite de recherche pour cette demande. Souhaitez-vous essayer une autre date ? Aucun rendez-vous n’a été enregistré. ♡';
 if(context.toolError)return 'Je ne peux pas vérifier le calendrier pour le moment. Je ne peux donc pas vous proposer de créneau fiable. Réessayez un peu plus tard ou contactez Mélanie au 06 62 28 75 45. 💕';
 const a=context.availability;
 if(!a&&context.requestedDate&&context.requestedDate<today())return 'Cette date est passée. Quelle date à venir vous conviendrait ? ♡';
 if(!a&&context.requestedDate&&!context.preference)return 'Préférez-vous le matin ou l’après-midi pour '+label(context.requestedDate)+' ? ♡';
 if(a?.requires_preference)return 'Préférez-vous le matin ou l’après-midi pour '+label(a.date)+' ? ♡';
 if(a?.past)return 'Cette date est passée. Quelle date à venir vous conviendrait ? ♡';
 if(a){
  if(a.alternative)return 'Je n’ai trouvé aucun créneau compatible le '+label(a.requested_date)+'. En revanche, le '+label(a.date)+', les créneaux vérifiés ('+a.total_minutes+' min) sont : '+a.available_starts.join(', ')+'. Cette autre date vous conviendrait-elle ? ♡';
  if(!a.available_starts.length)return 'Je n’ai trouvé aucun créneau compatible le '+label(a.date)+(context.preference==='morning'?' le matin':context.preference==='afternoon'?' l’après-midi':'')+'. Souhaitez-vous essayer une autre date ou une autre partie de la journée ? ♡';
  return 'Pour '+label(a.date)+', les créneaux vérifiés pour vos prestations ('+a.total_minutes+' min au total) sont : '+a.available_starts.join(', ')+'. Lequel préférez-vous ? Ils seront revérifiés lors de la confirmation. ♡';
 }
 // Sans preuve d'outil, les informations déjà connues ne sont pas redemandées.
 if(needsCalendarEvidence(reply)){
  const missing=[];
  if(!context.siteSelection?.length)missing.push('quelles prestations vous souhaitez');
  if(!context.requestedDate)missing.push('quelle date vous conviendrait');
  if(!context.preference)missing.push('si vous préférez le matin ou l’après-midi');
  return 'Je dois vérifier le calendrier avant de proposer ou confirmer un créneau. '+(missing.length?'Pouvez-vous me préciser '+missing.join(', puis ')+' ?':'Je peux rechercher les disponibilités pour votre sélection et votre préférence. Aucun rendez-vous n’est confirmé ici.')+' ♡';
 }
 return reply;
}
// Reconnaissance d'une prestation nommée par la cliente, à partir du catalogue (champ name).
// Une prestation est reconnue si tous les mots distinctifs de son nom figurent dans le message
// (« Kit complet uniquement » ← « kit press nails complet uniquement »). Sinon, si le message
// contient au moins deux mots distinctifs, les prestations qui les contiennent tous sont proposées.
// Plusieurs correspondances : demander la précision, jamais choisir au hasard.
const SERVICE_STOP=new Set(['de','la','le','les','un','une','du','des','et','pour','avec','sur','en','au','aux','ou','plus']);
function serviceWords(s){return norm(s).replace(/[’‘']/g,' ').split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!SERVICE_STOP.has(w));}
// Formulations courantes des clientes : « baby boomer », « 2 doigts » (le catalogue dit « Babyboomer », « Deux doigts »).
function normaliseServiceText(text){
 return norm(text).replace(/[’‘']/g,' ').replace(/\bbaby\s+boomer\b/g,'babyboomer').replace(/\b2\b/g,' deux ').replace(/\b4\b/g,' quatre ').replace(/\b6\b/g,' six ');
}
function matchServices(text,catalogue){
 const none={ids:[],names:[],ambiguous:null};
 if(!Array.isArray(catalogue))return none;
 // Le nom seul ne suffit pas : « Deux doigts » existe dans plusieurs catégories. Le chemin (« Babyboomer / babycolor »)
 // sert à départager : tous les mots de la cliente doivent être compatibles avec le nom ET la catégorie de la prestation.
 const leaves=catalogue.map(s=>({id:s.id,name:s.name,w:serviceWords(s.name),p:new Set(serviceWords(s.path||''))})).filter(x=>x.w.length);
 // Seuls les mots du vocabulaire du catalogue comptent : « je veux », « bonjour » ne sont pas des prestations.
 const vocabulary=new Set(leaves.flatMap(x=>[...x.w,...x.p]));
 const words=new Set(serviceWords(normaliseServiceText(text)).filter(w=>vocabulary.has(w)));
 if(!words.size)return none;
 const fits=x=>[...words].every(w=>x.w.includes(w)||x.p.has(w));
 let hits=leaves.filter(x=>x.w.every(w=>words.has(w))&&fits(x));
 if(!hits.length&&words.size>=2)hits=leaves.filter(x=>[...words].every(w=>x.w.includes(w)||x.p.has(w)));
 if(hits.length===1)return {ids:[hits[0].id],names:[hits[0].name],ambiguous:null};
 if(hits.length>1)return {ids:[],names:hits.map(x=>x.name).slice(0,4),ambiguous:hits.map(x=>x.name).slice(0,4)};
 return none;
}
// Heure de créneau dans un message qui contient déjà une date : « Le 27 octobre à 10h40 ».
// « à » est exigé : « vers 15h » reste une préférence, pas un choix de créneau.
function timeAfterA(text){
 const t=norm(text).replace(/[’‘]/g,"'");
 const m=t.match(/\ba\s+([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?\b/);
 if(!m)return null;
 const hour=Number(m[1]);
 if(hour<7||hour>20)return null;
 return String(hour).padStart(2,'0')+':'+(m[2]||'00');
}
// Coordonnées données par la cliente : libellés (« Nom : », « Téléphone : », « E-mail : ») ou formules simples.
function contactFrom(text){
 const raw=String(text||'');
 const out={};
 const email=raw.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
 if(email)out.email=email[0];
 const phone=raw.match(/(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/);
 if(phone)out.phone=phone[0].trim();
 const name=raw.match(/(?:\bnom(?:\s+et\s+pr[ée]nom)?|je m['’]appelle|au nom de|je suis|prénom)\s*(?:est)?\s*[:=]?\s*([A-Za-zÀ-ÿ'’\- ]{2,60}?)\s*(?=\n|,|;|$|\s+(?:t[ée]l|tel|mobile|e-?mail|mail)\b|\s+\d)/i);
 if(name)out.name=name[1].trim();
 return out;
}
// Coordonnées sur tout l'historique : chaque champ prend la mention la plus récente.
// Réponse « nom seul » : seulement si Melba vient de demander le nom, et si le message est un nom simple.
const NOT_A_NAME=new Set(['oui','non','merci','ok','bonjour','svp','je','confirme','valide','recapitulatif','bien','d','accord']);
function bareName(text){
 const t=String(text||'').trim();
 if(!/^[A-Za-zÀ-ÿ'’\- ]{2,60}$/.test(t))return null;
 const words=t.split(/\s+/);
 if(words.length>5||words.some(w=>NOT_A_NAME.has(norm(w).replace(/[’']/g,''))))return null;
 return t;
}
function askedForName(assistantText){return /\b(votre|ton|le) nom\b/.test(norm(assistantText));}
// Le dernier message de la cliente est-il son nom, en réponse à la demande de Melba ?
function isNameAnswer(messages){
 const list=messages.filter(m=>typeof m.content==='string');
 const last=list.at(-1),prev=list.at(-2);
 return Boolean(last&&last.role==='user'&&prev&&prev.role==='assistant'&&askedForName(prev.content)&&bareName(last.content));
}
function contactFromHistory(messages){
 const merged={};
 const list=messages.filter(m=>typeof m.content==='string');
 // Le nom donné en réponse à la question de Melba est le plus récent : il prime.
 if(isNameAnswer(list))merged.name=bareName(list.at(-1).content);
 for(const m of [...list].reverse().filter(m=>m.role==='user')){
  const found=contactFrom(m.content);
  for(const k of ['name','phone','email'])if(merged[k]===undefined&&found[k])merged[k]=found[k];
 }
 return merged;
}
function isRecapRequest(text){return /\b(recapitulatif|resume de (ma|la) (demande|reservation)|recap)\b/.test(norm(text));}
function isConfirmWord(text){const t=norm(text).replace(/[’‘]/g,"'");return /\b(je confirme|confirme|je valide|c'est bon pour moi)\b/.test(t)&&!/\b(pas|ne|non|annul\w*)\b/.test(t);}
module.exports={today,validDate,requestedDate,preference,time,label,choose,directReply,guardedReply,needsCalendarEvidence,hasDateExpression,startHour,planningContext,selectedTime,matchServices,timeAfterA,contactFrom,contactFromHistory,isRecapRequest,isConfirmWord,isNameAnswer,bareName};
