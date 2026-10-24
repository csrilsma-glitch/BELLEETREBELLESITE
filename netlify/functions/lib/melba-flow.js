'use strict';
// Parcours métier déterministe. Aucune écriture : seul le bouton cliente appelle reservations.
const crypto=require('node:crypto'),c=require('./core'),b=require('./booking'),p=require('./melba-policy');
const COOKIE='br15_melba_flow',TTL=30*60*1000;
const QUESTIONS={alternative:'Souhaitez-vous que je cherche un autre jour ?',date:'Quelle date vous conviendrait ?',period:'Préférez-vous le matin ou l’après-midi ?',time:'Quel horaire choisissez-vous ?',surname:'Quel est votre nom de famille ?',firstname:'Quel est votre prénom ?',email:'Quelle est votre adresse e-mail ?',phone:'Quel est votre numéro de téléphone ?'};
const cookie=(value,seconds=1800)=>`${COOKIE}=${encodeURIComponent(value)}; Path=/.netlify/functions/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
const clearCookie=()=>cookie('',0);
function readContact(event,state){
 try{const token=c.cookies(event)[COOKIE];if(!token||token.length>3000)return {};const v=c.unseal(token);if(v.id!==state.id||v.expires<Date.now()||v.expires>Date.now()+TTL)return {};return v;}catch{return {};}
}
function personName(raw,kind){
 let value=String(raw).trim().replace(/[.!]+$/,'').trim();
 value=value.replace(kind==='surname'?/^(?:(?:mon )?nom(?: de famille)?(?: est)?\s*[:=]?\s*|je m['’]appelle\s+)/i:/^(?:(?:mon )?pr[ée]nom(?: est)?\s*[:=]?\s*|je m['’]appelle\s+)/i,'').trim();
 return /^[\p{L}][\p{L}\p{M}'’ -]{0,59}$/u.test(value)&&!/[?]/.test(raw)&&!p.isConfirmWord(value)&&!['oui','non','merci','bonjour','ok'].includes(p.norm?.(value)||value.toLowerCase())?value:null;
}
function serviceMatch(text,catalogue,familyHint){
 // Protéger les séparateurs faisant partie d'un vrai nom avant de découper une sélection.
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s*\+\s*/g,' + ').replace(/\s+/g,' ').trim();
 let guarded=normalize(text);
 const labels=[...new Set(catalogue.flatMap(s=>[s.name,...String(s.path||'').split('›').map(x=>x.trim())]))].sort((a,b)=>b.length-a.length);
 for(const label of labels){if(!/\+|\bet\b/.test(normalize(label)))continue;const n=normalize(label),protectedName=n.replace(/\+/g,'\uE000').replace(/\bet\b/g,'\uE001');guarded=guarded.split(n).join(protectedName);}
 const chunks=guarded.split(/\s*\+\s*|\s+et\s+/i).map(x=>x.replace(/\uE000/g,'+').replace(/\uE001/g,'et'));
 if(chunks.length===1)return p.matchServices(text,catalogue,familyHint);
 const parts=chunks.map(chunk=>p.matchServices(chunk,catalogue,familyHint));
 const definite=[...new Set(parts.flatMap(m=>m.ids))];
 if(parts.some(m=>!m.ids.length&&!m.ambiguous)||parts.filter(m=>m.ambiguous).length>1)return {ids:[],unresolved:true};
 const ambiguous=parts.find(m=>m.ambiguous);
 if(ambiguous)return {...ambiguous,pendingServices:definite};
 if(parts.some(m=>!m.ids.length))return {ids:[],unresolved:true};
 return {ids:definite};
}
async function handle({event,payload,messages,previous,resume=false}){
 const text=messages.at(-1).content,now=Date.now();
 const old=previous?.flow===2&&previous.expires>now?previous:
  Array.isArray(previous?.services)&&previous.services.length?{flow:2,id:crypto.randomUUID(),expires:now+TTL,services:previous.services,date:previous.date||undefined,preference:previous.preference||undefined,start:previous.start||undefined,step:previous.start?'surname':previous.date?'period':'date'}:null;
 const direct=p.directReply(text);
 if(direct)return c.json(200,{reply:direct,signature:c.sign('melba-reply:'+direct),pendingBooking:null,resetFlow:true},{'Set-Cookie':clearCookie()});
 // Les conseils et réclamations conservent la boucle Claude existante et le contexte du parcours.
 if(/probl[èe]me|r[ée]clam|douleur|allerg|m[ée]content|difficult/i.test(text)||(/\?/.test(text)&&/diff[ée]rence|conseil|horaires? d['’]ouverture|o[ùu] (?:est|se trouve)/i.test(text)))return null;
 const selected=Array.isArray(payload.selected_service_ids)&&payload.selected_service_ids.length?c.ids(payload.selected_service_ids):[];
 // L'IA reste en charge des conseils, questions libres et réclamations hors parcours.
 const intent=/r[ée]serv|rendez[- ]?vous|\brdv\b|cr[ée]neau|disponib|\bkit\b|\bpose\b|\bgel\b|\bsemi[- ]?permanent\b|\bpress\b|baby\s?boomer/i.test(text);
 if(!old&&!selected.length&&(!intent||(/\?/.test(text)&&!/r[ée]serv|rendez[- ]?vous|\brdv\b|cr[ée]neau|disponib/i.test(text))))return null;
 const catalogue=await c.db('br15_services?active=eq.true&order=position.asc');
 const match=(!old||['service','date','period','time','alternative'].includes(old.step))?serviceMatch(text,catalogue,old?.family):{ids:[]};
 let state=old?{...old}:{flow:2,id:crypto.randomUUID(),expires:now+TTL,step:'service',services:[]};
 let contact=readContact(event,state),privateTurn=['surname','firstname','email','phone','recap'].includes(state.step);
 function reply(message,{pendingBooking=null,choices,reset=false}={}){
  // Le mode réservation est explicite dans le contexte signé ; les coordonnées n'y figurent jamais.
  const bookingContext={...state,mode:'reservation'};
  // Les données clientes ne figurent jamais dans ce contexte signé/restaurable.
  const headers={};
  if(['surname','firstname','email','phone'].some(k=>contact[k]))headers['Set-Cookie']=cookie(c.seal({...contact,id:state.id,expires:state.expires}),Math.max(0,Math.ceil((state.expires-Date.now())/1000)));
  if(reset)headers['Set-Cookie']=clearCookie();
  return c.json(200,{reply:message+' ♡',signature:c.sign('melba-reply:'+message+' ♡'),bookingContext,contextSignature:c.sign('melba-context:'+JSON.stringify(bookingContext)),pendingBooking,private:privateTurn,flowStep:state.step,...(choices?{choices}:{})},headers);
 }
 const names=()=>state.services.map(id=>catalogue.find(s=>s.id===id)).filter(Boolean).map(s=>p.serviceLabel(s,catalogue)).join(' + ');


 let changed=match.ids?.length&&JSON.stringify(match.ids)!==JSON.stringify(state.services);
 const siteChanged=selected.length&&JSON.stringify(selected)!==JSON.stringify(state.siteSelection||[])&&JSON.stringify(selected)!==JSON.stringify(state.services);
 if(match.unresolved)return reply('Je n’ai pas identifié toute votre sélection. Pouvez-vous préciser les prestations à enchaîner ?');
 if(match.ambiguous){
  if(match.pendingServices?.length)state.pendingServices=match.pendingServices;
  // La famille nommée reste en mémoire signée : la réponse « Quatre doigts » est résolue dans cette famille.
  if(match.ambiguousFamily)state.family=match.ambiguousFamily;else delete state.family;
  return reply(match.ambiguousFamily?'Dans « '+match.ambiguousFamily+' », quelle option souhaitez-vous : '+match.ambiguous.join(', ')+' ?':'Plusieurs prestations correspondent : '+match.ambiguous.join(' ou ')+'. Laquelle souhaitez-vous ?');
 }
 if(match.ids?.length){delete state.family;if(state.pendingServices?.length){match.ids=[...new Set([...state.pendingServices,...match.ids])];delete state.pendingServices;}}
 changed=match.ids?.length&&JSON.stringify(match.ids)!==JSON.stringify(state.services);
 if(changed||siteChanged){
  delete state.alternativeDates;delete state.offeredPeriod;state.services=siteChanged?selected:match.ids;state.siteSelection=selected;state.step='date';delete state.start;delete state.date;delete state.preference;
 }
 if(!state.services.length&&state.family){const options=p.matchServices(state.family,catalogue).ambiguous;if(options)return reply('Dans « '+state.family+' », quelle option souhaitez-vous : '+options.join(', ')+' ?');}
 if(!state.services.length){state.step='service';return reply('Quelle prestation souhaitez-vous ? Vous pouvez aussi composer plusieurs prestations dans le crâne.');}
 const quote=await c.rpc('quote',{p_ids:c.ids(state.services)});
 if(resume&&['surname','firstname','email','phone','recap'].includes(state.step)){state.step=!contact.surname?'surname':!contact.firstname?'firstname':!contact.email?'email':!contact.phone?'phone':'recap';return state.step==='recap'?recap():reply(QUESTIONS[state.step]);}
 if(old&&/^(?:sans acompte\s*\??|(?:faut.il|dois.je) payer.*|comment payer.*)$/i.test(text.trim()))return state.step==='recap'?recap():reply('Le paiement se fait uniquement sur place, sans acompte. '+QUESTIONS[state.step]);
 const edit=text.match(/(?:modifier|corriger|changer)\s+(?:(?:mon|ma|le|la|l['’])\s*)?(nom(?: de famille)?|pr[ée]nom|e-?mail|adresse e-?mail|t[ée]l[ée]phone|num[ée]ro|date|horaire|heure|prestation)/i);
 if(old&&edit){
  const key=edit[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/date|horaire|heure/.test(key)){state.step='date';delete state.date;delete state.start;delete state.preference;}
  else if(key==='prestation'){state.step='service';state.services=[];delete state.date;delete state.start;delete state.preference;}
  else{const field=key.startsWith('prenom')?'firstname':key.startsWith('nom')?'surname':/mail/.test(key)?'email':'phone';delete contact[field];state.step=field;privateTurn=true;}
  return reply(QUESTIONS[state.step]||'Quelle prestation souhaitez-vous ?');
 }

 // Refuser la seule période disponible ne doit jamais réinitialiser la préférence.
 const normalized=String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 // Aux étapes horaire et période, seul « le <jour> » est un changement de date : un nombre seul peut être une heure.
 const explicitDay=/^le\s+\d/.test(normalized);
 const dateExpected=['date','alternative'].includes(state.step)||(['time','period'].includes(state.step)&&explicitDay);
 const shortAnchor=state.date||(dateExpected&&state.alternativeDates?.find(d=>p.abbreviatedDate(text,d)===d))||null;
 const shortDate=dateExpected?p.abbreviatedDate(text,shortAnchor):undefined;
 const accepted=/^(?:oui|oui\b.*|d['’]accord|ok|volontiers|cherchez(?:.*)|cherche(?:.*)|allez[- ]y)[.! ]*$/i.test(normalized);
 const rejected=/^(?:non|pas|je ne veux pas|je prefere pas)\b/i.test(normalized);
 const periodName=()=>state.preference==='morning'?'le matin':state.preference==='afternoon'?'l’après-midi':'sur une période disponible';
 function offerAnother(reason){
  state.step='alternative';delete state.start;delete state.requestedTime;delete state.offeredPeriod;delete state.alternativeDates;
  return reply(reason+' Souhaitez-vous que je cherche un autre jour avec des créneaux '+periodName()+' ?', {choices:['Oui, chercher un autre jour','Choisir une autre date']});
 }
 if(state.step==='alternative'&&!changed&&!siteChanged){
  const pref=p.preference([{role:'user',content:text}]);if(pref)state.preference=pref;
  if(shortDate!==undefined||p.hasDateExpression(text)){state.step='date';delete state.alternativeDates;}
  else if(accepted){
   // Recherche bornée et ordonnée ; chaque date proposée provient du moteur métier.
   // Ne jamais présenter comme disponible une date non consultée ni un résultat partiel en cas d’erreur.
   const dates=[],start=state.date||p.today();
   for(let offset=1;offset<=14&&dates.length<3;offset++){
    const day=new Date(start+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+offset);const date=day.toISOString().slice(0,10);
    if(date<p.today())continue;
    const slots=await b.availability(date,state.services);
    if(slots.some(s=>!state.preference||state.preference==='any'||(Number(p.time(s.starts).slice(0,2))<12)===(state.preference==='morning')))dates.push(date);
   }
   delete state.date;delete state.start;delete state.requestedTime;state.step='date';state.alternativeDates=dates;
   if(!dates.length)return reply('Je n’ai trouvé aucun créneau compatible '+periodName()+' dans les 14 jours suivant le '+p.label(start)+'. Je conserve vos prestations et votre préférence. Quelle autre date souhaitez-vous vérifier ?');
   return reply('J’ai vérifié des disponibilités compatibles avec vos '+quote.minutes+' min '+periodName()+' : '+dates.map(d=>p.label(d)).join(', ')+'. Quelle date préférez-vous ?', {choices:dates.map(d=>p.label(d))});
  }else if((rejected&&!pref)||/choisir une autre date/.test(normalized)){
   state.step='date';delete state.date;delete state.alternativeDates;return reply('D’accord, je conserve vos prestations et votre préférence. Quelle autre date souhaitez-vous vérifier ?');
  }else return reply('Je garde votre préférence pour '+periodName()+'. Souhaitez-vous que je cherche un autre jour ?', {choices:['Oui, chercher un autre jour','Choisir une autre date']});
 }

 // Une date/heure explicite peut être donnée en avance, jamais réclamée à nouveau.
 if(['date','period','time'].includes(state.step)){
  if(shortDate!==undefined||p.hasDateExpression(text)){
   const date=shortDate!==undefined?shortDate:p.requestedDate([{role:'user',content:text}]);
   if(!date||date<p.today()){state.step='date';delete state.date;delete state.start;return reply('Cette date est passée ou invalide. Quelle date à venir vous conviendrait ?');}
   if(date!==state.date){state.date=date;delete state.start;delete state.alternativeDates;delete state.offeredPeriod;}
  }
  const preference=p.preference([{role:'user',content:text}]);if(preference)state.preference=preference;
  const time=p.selectedTime(text)||p.timeAfterA(text);if(time)state.requestedTime=time;
  if(!state.date){state.step='date';return reply((changed||siteChanged?'Très bien, '+names()+' ('+(quote.cents/100).toLocaleString('fr-FR')+' € · '+quote.minutes+' min). ':'')+QUESTIONS.date);}
  const slots=await b.availability(state.date,state.services);
  if(!slots.length)return offerAnother('Je n’ai trouvé aucun créneau compatible le '+p.label(state.date)+'.');
  const periods=[...new Set(slots.map(s=>Number(p.time(s.starts).slice(0,2))<12?'morning':'afternoon'))];
  if(state.step==='period'&&rejected&&!state.preference&&state.offeredPeriod){state.preference=state.offeredPeriod==='morning'?'afternoon':'morning';return offerAnother('D’accord, vous ne souhaitez pas cette période.');}
  if(state.requestedTime){
   const slot=slots.find(s=>p.time(s.starts)===state.requestedTime);
   if(slot){state.start=state.requestedTime;state.preference=Number(state.start.slice(0,2))<12?'morning':'afternoon';delete state.requestedTime;state.step='surname';privateTurn=true;}
   else{delete state.requestedTime;state.step='time';return reply('Cet horaire n’est pas disponible. '+QUESTIONS.time,{choices:p.choose(slots,state.preference||'any').map(s=>p.time(s.starts))});}
  }else if(!state.preference){
   if(state.step==='period'&&periods.length===1&&/^(?:oui|d['’]accord|ok)[.! ]*$/i.test(text))state.preference=periods[0];
   if(!state.preference){
   state.step='period';state.offeredPeriod=periods.length===1?periods[0]:undefined;
   return reply('Pour '+p.label(state.date)+', '+(periods.length===2?QUESTIONS.period.charAt(0).toLowerCase()+QUESTIONS.period.slice(1):periods[0]==='morning'?'seul le matin dispose de créneaux compatibles. Souhaitez-vous le matin ?':'seul l’après-midi dispose de créneaux compatibles. Souhaitez-vous l’après-midi ?'),{choices:periods.map(x=>x==='morning'?'Matin':'Après-midi')});
   }
  }
  if(state.step!=='surname'){
   if(state.step==='period'&&periods.length===1&&/^(?:oui|d['’]accord|ok)[.! ]*$/i.test(text))state.preference=periods[0];
   const filtered=slots.filter(s=>state.preference==='any'||(Number(p.time(s.starts).slice(0,2))<12)===(state.preference==='morning'));
   if(!filtered.length)return offerAnother('Je comprends votre préférence. Malheureusement, je n’ai pas de disponibilité '+p.label(state.date)+' '+periodName()+'.');
   state.step='time';const choices=p.choose(filtered,'any').map(s=>p.time(s.starts));
   return reply('Les créneaux vérifiés pour '+quote.minutes+' min le '+p.label(state.date)+' sont : '+choices.join(', ')+'. '+QUESTIONS.time,{choices});
  }
  // Nom et prénom déjà collectés ne sont pas redemandés en cas de changement de créneau.
  state.step=!contact.surname?'surname':!contact.firstname?'firstname':!contact.email?'email':!contact.phone?'phone':'recap';
  return state.step==='recap'?recap():reply(QUESTIONS[state.step]);
 }
 if(['surname','firstname','email','phone','recap'].includes(state.step)){
  privateTurn=true;
  // Le cookie chiffré survit au rafraîchissement ; s'il expire, aucune donnée n'est inventée.
  const expected=!contact.surname?'surname':!contact.firstname?'firstname':!contact.email?'email':!contact.phone?'phone':'recap';
  if(state.step!==expected){state.step=expected;if(expected!=='recap')return reply('Pour reprendre votre demande, '+QUESTIONS[expected].charAt(0).toLowerCase()+QUESTIONS[expected].slice(1));}
  if(state.step==='surname'||state.step==='firstname'){
   const value=personName(text,state.step);if(!value)return reply(QUESTIONS[state.step]);contact[state.step]=value;
  }else if(state.step==='email'){
   const value=p.contactFrom(text).email||text.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||value.length>254)return reply('Cette adresse ne semble pas valide. '+QUESTIONS.email);contact.email=value;
  }else if(state.step==='phone'){
   try{contact.phone=c.phone(p.contactFrom(text).phone||text);}catch{return reply('Ce numéro ne semble pas valide. '+QUESTIONS.phone);}
  }
  state.step=!contact.surname?'surname':!contact.firstname?'firstname':!contact.email?'email':!contact.phone?'phone':'recap';
  if(state.step!=='recap')return reply(QUESTIONS[state.step]);
  return recap();
 }
 return reply(QUESTIONS[state.step]||QUESTIONS.date);
 async function recap(){
  const slots=await b.availability(state.date,state.services),slot=slots.find(s=>p.time(s.starts)===state.start);
  if(!slot){state.step='date';delete state.start;delete state.date;delete state.preference;return reply('Ce créneau vient de devenir indisponible. Je conserve vos coordonnées. '+QUESTIONS.date);}
  const pendingBooking={service_ids:state.services,starts:slot.starts,client_name:contact.surname+' '+contact.firstname,client_email:contact.email,client_phone:contact.phone,quote,melba_flow:true};
  return reply('Voici votre récapitulatif : '+names()+', '+(quote.cents/100).toLocaleString('fr-FR')+' € pour '+quote.minutes+' min, '+p.label(state.date)+' à '+state.start+'. Nom : '+contact.surname+'. Prénom : '+contact.firstname+'. E-mail : '+contact.email+'. Téléphone : '+contact.phone+'. Paiement sur place, sans acompte. Aucun rendez-vous n’est encore enregistré. Vérifiez ces informations, puis cliquez sur « Confirmer mon rendez-vous ».',{pendingBooking});
 }
}
module.exports={handle,personName,serviceMatch,clearCookie,COOKIE,TTL};
