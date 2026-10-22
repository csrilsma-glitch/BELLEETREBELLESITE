// Garde-fous métier : aucune donnée cliente ni secret, aucune écriture.
const ZONE='Europe/Paris';
const months=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const today=(now=new Date())=>new Intl.DateTimeFormat('fr-CA',{timeZone:ZONE}).format(now);
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
function requestedDate(messages,now=new Date()){
 const current=today(now),year=Number(current.slice(0,4));
 for(const m of [...messages].reverse().filter(m=>m.role==='user'&&typeof m.content==='string')){
  const text=norm(m.content);
  const relative=/\bapres[- ]?demain\b/.test(text)?2:/\bdemain\b/.test(text)?1:/aujourd['’]hui/.test(text)?0:null;
  if(relative!==null){const d=new Date(current+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+relative);return d.toISOString().slice(0,10);}
  const iso=text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if(iso)return validDate(iso[1])?iso[1]:null;
  const re=new RegExp('\\b(\\d{1,2})(?:er)?\\s+('+months.join('|')+')(?:\\s+(\\d{4}))?\\b');
  const match=text.match(re);if(!match)continue;
  const month=months.indexOf(match[2])+1,day=Number(match[1]);
  for(let y=match[3]?Number(match[3]):year;y<=(match[3]?Number(match[3]):year+8);y++){
   const date=`${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
   if(validDate(date)&&(match[3]||date>=current))return date;
  }
  return null;
 }
 return null;
}
function preference(messages){
 for(const m of [...messages].reverse().filter(m=>m.role==='user'&&typeof m.content==='string')){
  const t=norm(m.content);if(/peu importe|indifferent|n'importe|toute la journee/.test(t))return 'any';
  if(/apres[- ]?midi|soir/.test(t))return 'afternoon';if(/matin/.test(t))return 'morning';
  const h=t.match(/\b([01]?\d|2[0-3])(?:h(?:[0-5]\d)?|:[0-5]\d)\b/);if(h)return +h[1]<12?'morning':'afternoon';
 }
 return null;
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
 if(/erreur|faux horaire|horaire incorrect|mauvais horaire|pas disponible/.test(t))return null;
 if(/(?:annuler|annule|supprimer|deplacer|modifier)\s+(?:mon|notre|le|un)\s+(?:rendez[- ]?vous|rdv|reservation)/.test(t))return 'Pour modifier ou annuler un rendez-vous déjà enregistré, utilisez le lien sécurisé de votre e-mail de confirmation. Si vous ne le retrouvez pas, contactez Mélanie au 06 62 28 75 45. Aucune annulation n’a été effectuée ici.';
 if(/^(?:(?:non|merci|finalement)[ ,!.]*)?(?:je change d['’]avis|j['’]ai change d['’]avis|je laisse tomber|laisse(?:z)? tomber|je ne veux plus reserver|je ne souhaite plus reserver|on arrete|arretons|pas maintenant|au revoir|stop|j['’]abandonne)(?:[ ,.!]|$)/.test(t))return 'Pas de souci ! 😊 N’hésitez pas à revenir quand vous voulez, je reste à votre disposition. 💕';
 return null;
}
function guardedReply(reply,context){
 if(context.openingQuestion&&context.openingHours&&!context.availability&&!context.pending)return 'Les horaires habituels du studio, en heure de Paris, sont : '+context.openingHours+'. Les rendez-vous et absences peuvent réduire les créneaux : leur disponibilité doit être vérifiée dans le calendrier. ♡';
 if(context.pending)return 'Voici votre proposition, à relire ci-dessous. Aucun rendez-vous n’est encore enregistré : cochez la case puis cliquez sur Confirmer si tout vous convient. ♡';
 if(context.bookingRejected&&!context.pending)return 'Ce créneau ne convient plus à votre demande. Je peux rechercher d’autres disponibilités pour vos prestations. Aucun rendez-vous n’a été enregistré. ♡';
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
 // Les heures et les assertions de disponibilité du texte libre ne font jamais autorité.
 if(/\b(?:[01]?\d|2[0-3])\s*(?:h(?:\s*[0-5]\d)?|:[0-5]\d)\b|(?:creneau|horaire|place).{0,40}(?:disponible|libre)|(?:disponible|libre).{0,40}(?:creneau|horaire|place)|je (?:peux vous (?:prendre|accueillir)|vous propose).{0,50}(?:matin|apres.midi|demain)|(?:vous etes|c'est|tout est).{0,20}(?:reserve|confirme)|\b(?:dix|onze|douze|treize|quatorze|quinze|seize|dix.sept|dix.huit|dix.neuf|vingt|\d{1,2}) heures?\b|\b(?:venez|passez) (?:demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i.test(norm(reply)))return 'Je dois vérifier le calendrier pour vous proposer un horaire. Quelles prestations et quelle date souhaitez-vous, plutôt le matin ou l’après-midi ? ♡';
 if(/(?:rendez[- ]?vous|reservation|rdv).{0,60}(?:confirm|enregistr|annul)|(?:confirme|annule).{0,40}(?:rendez[- ]?vous|reservation|rdv)/i.test(norm(reply)))return 'Un rendez-vous est enregistré uniquement après votre clic sur Confirmer et le message de réussite du site. Pour gérer un rendez-vous existant, utilisez son lien sécurisé. ♡';
 return reply;
}
module.exports={today,validDate,requestedDate,preference,time,label,choose,directReply,guardedReply};
