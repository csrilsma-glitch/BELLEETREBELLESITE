// Fonction serveur : relaie la conversation vers Claude, qui peut consulter
// et réserver dans le calendrier natif de Mélanie via des outils.
// La clé API Anthropic reste ici (variable ANTHROPIC_API_KEY).
// La variable doit être présente au moment du déploiement Netlify des Functions.


const policy = require('./lib/melba-policy');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;
const MAX_TOOL_ROUNDS = 5;

// Catalogue : même fichier que le sélecteur du site (site/assets/prestations.json).
// Le catalogue serveur est prioritaire pour les tarifs et durées.
const CATALOGUE = require('../../site/assets/prestations.json').services;

function toMinutes_(dur) {
  const m = String(dur || '').match(/^(\d+)h(\d{2})$/);
  return m ? (+m[1]) * 60 + (+m[2]) : 30;
}
function priceText(p) {
  if (p === 0) return 'offert';
  return p == null ? 'prix à confirmer' : p + ' €';
}

const SERVICES = CATALOGUE.map(s => ({
  id: s.id,
  name: s.path,
  duration: toMinutes_(s.dur),
  price: s.price,
}));

const SYSTEM_PROMPT = `Tu es Melba, l'assistante de Belle & Rebelle, nail studio de Mélanie à Flers (28 rue de Messei, 61100 Flers).
Tu réponds en français, de façon chaleureuse, courte et simple.

Prestations (durées et prix indicatifs) :
${SERVICES.map(s => `- ${s.name} (id: ${s.id}) : ${s.duration} min, ${priceText(s.price)}`).join('\n')}

Tu peux :
- présenter les prestations et conseiller ;
- vérifier les disponibilités avec l'outil check_availability ;
- réserver avec l'outil book_appointment, quand la cliente a confirmé.

Si la cliente signale un problème, une réclamation, une difficulté, une douleur, une allergie, un mécontentement ou un mot qui s'en approche, utilise l'outil notify_melanie avec un résumé court et utile (sans données personnelles superflues), puis dis-lui que Mélanie la recontactera. N'affirme jamais que le message est parti si l'outil répond qu'il ne l'a pas envoyé.

Règles pour réserver :
1. Ne récite pas tout le catalogue : demande à la cliente ce qu'elle souhaite (famille puis prestation), puis la date souhaitée, puis vérifie les disponibilités.
2. Propose les horaires réellement disponibles, sans en inventer.
3. Avant de réserver, demande le nom, le téléphone et l'e-mail de la cliente.
4. Récapitule (prestations, date, heure, durée totale) et attends son accord explicite.
5. Ne réserve jamais sans cet accord.
6. Si une réservation échoue, ne promets rien : demande à la cliente d'appeler Mélanie au 06 62 28 75 45.

Conversation : si la cliente change d'avis, abandonne une proposition ou dit au revoir, réponds brièvement et chaleureusement. N'affirme pas qu'un rendez-vous a été annulé ; aucune annulation ne se fait par ces outils. Ne développe pas spontanément des problèmes techniques sans rapport avec sa demande. Corrige honnêtement une erreur si elle affecte réellement sa demande.
Dates : utilise exclusivement la date actuelle et le fuseau Europe/Paris fournis ci-dessous. Sans année, une date désigne sa prochaine occurrence. Ne confonds jamais jour de semaine et date. Une date explicitement passée doit être clarifiée.
Avant de proposer des horaires, demande matin ou après-midi, sauf préférence déjà exprimée. Appelle check_availability pour la date et toutes les prestations choisies ; ne propose jamais d'horaire sur la seule base de ton texte ou de l'historique. Si aucun créneau ne convient, vérifie une autre date avant de la proposer comme disponible. N'invente aucune disponibilité si un outil échoue. N'utilise pas de Markdown : réponds en texte simple.

Plusieurs prestations enchaînées forment un seul rendez-vous continu. L'outil check_availability te donne les horaires qui conviennent pour toutes les prestations à la suite.`;

const TOOLS = [
  {
    name: 'notify_melanie',
    description: 'Envoie un e-mail à Mélanie (belleetrebelle.flers@outlook.com) pour signaler un problème ou une demande à traiter.',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Objet court du message' },
        summary: { type: 'string', description: 'Résumé de ce que la cliente demande ou signale' },
        client_contact: { type: 'string', description: 'Nom et moyen de contact, seulement si la cliente les a donnés' },
      },
      required: ['subject', 'summary'],
    },
  },
  {
    name: 'check_availability',
    description: 'Retourne les heures de début possibles pour enchaîner une ou plusieurs prestations à une date donnée.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date au format AAAA-MM-JJ' },
        service_ids: { type: 'array', items: { type: 'string' }, description: 'Ids des prestations, dans l\'ordre' },
      },
      required: ['date', 'service_ids'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Réserve dans le calendrier natif les prestations enchaînées, à partir de l\'heure donnée. À utiliser seulement après accord de la cliente.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date au format AAAA-MM-JJ' },
        start: { type: 'string', description: 'Heure de début au format HH:MM' },
        service_ids: { type: 'array', items: { type: 'string' } },
        client_name: { type: 'string' },
        client_phone: { type: 'string' },
        client_email: { type: 'string' },
      },
      required: ['date', 'start', 'service_ids', 'client_name', 'client_phone', 'client_email'],
    },
  },
];

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

function pickServices(ids) {
  const list = ids.map(id => SERVICES.find(s => s.id === id));
  if (!list.length || list.some(s => !s)) throw new Error('Prestation inconnue');
  return list;
}

const NOT_ONLINE = 'Cette prestation ne peut pas être réservée en ligne pour le moment. Demandez à la cliente d\'appeler Mélanie au 06 62 28 75 45.';

// Heures de début où toutes les prestations, enchaînées, sont disponibles.
async function sendMailToMelanie({ subject, summary, client_contact }) {
  if (process.env.APP_ENV === 'preproduction') return { ok: false, message: 'Envoi d\'e-mail désactivé en préproduction.' };
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, message: 'Envoi d\'e-mail non configuré sur le site.' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Belle & Rebelle <reservation@belleetrebelle-nailstudio.fr>',
      to: ['belleetrebelle.flers@outlook.com'],
      subject: '[Melba] ' + subject,
      text: summary + (client_contact ? '\n\nContact : ' + client_contact : ''),
    }),
  });
  if (!res.ok) return { ok: false, message: 'Le message n\'a pas pu être envoyé.' };
  return { ok: true, message: 'Message transmis à Mélanie.' };
}

// Budget partagé par toute une requête HTTP, y compris les tours d'outils et la proposition.
const MAX_CALENDAR_CALLS=4,MAX_ALTERNATIVE_DAYS=3;
async function calendarAvailability(date,ids,context){
  if((context.calendarCalls||0)>=MAX_CALENDAR_CALLS){context.calendarBudgetReached=true;require('./lib/core').fail(429,'Budget de recherche du calendrier atteint');}
  context.calendarCalls=(context.calendarCalls||0)+1;
  return require('./lib/booking').availability(date,ids);
}
function toolDate(input,context){
  // Seul un contexte résolu par le serveur peut imposer une date. Une ancienne
  // valeur requestedDate seule ne doit pas écraser un nouveau jour demandé.
  return context.dateSource?context.requestedDate||input.date:input.date;
}

// V15 : le prompt et la boucle Claude d'origine sont conservés.
// La création native demande un clic explicite côté cliente, jamais une décision du modèle.
async function nativeRunTool(name,input,context) {
  const c=require('./lib/core'),b=require('./lib/booking');
  if(name!=='notify_melanie'&&context.invalidDate)return {ok:false,date_invalid:true};
  if(name==='notify_melanie')return sendMailToMelanie(input);
  if(name==='check_availability'){
    input={...input,date:toolDate(input,context)};
    c.date(input.date);
    if(input.date<policy.today()){context.availability={date:input.date,past:true};return context.availability;}
    if(!context.preference){context.availability={date:input.date,requires_preference:true};return context.availability;}
    const slots=await calendarAvailability(input.date,input.service_ids,context);
    const q=await c.rpc('quote',{p_ids:c.ids(input.service_ids)});
    context.availability={date:input.date,total_minutes:q.minutes,total_cents:q.cents,available_starts:policy.choose(slots,context.preference).map(x=>policy.time(x.starts))};
    if(!context.availability.available_starts.length){
      // Alternative vérifiée, jamais une date devinée par le modèle.
      const day=new Date(input.date+'T12:00:00Z');
      for(let i=1;i<=MAX_ALTERNATIVE_DAYS;i++){
        day.setUTCDate(day.getUTCDate()+1);const date=day.toISOString().slice(0,10);
        const alternatives=policy.choose(await calendarAvailability(date,input.service_ids,context),context.preference);
        if(alternatives.length){context.requestedDate=date;context.availability={...context.availability,requested_date:input.date,date,alternative:true,available_starts:alternatives.map(x=>policy.time(x.starts))};break;}
      }
    }
    return context.availability;
  }
  if(name==='book_appointment'){
    input={...input,date:toolDate(input,context)};
    if(!context.preference){context.availability={date:input.date,requires_preference:true};return context.availability;}
    if(input.date<policy.today())return {ok:false,message:'Cette date est passée.'};
    const slots=await calendarAvailability(input.date,input.service_ids,context);
    const slot=slots.filter(x=>context.preference==='any'||(Number(policy.time(x.starts).slice(0,2))<12)===(context.preference==='morning')).find(x=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date(x.starts))===input.start);
    if(!slot){context.bookingRejected=true;return {ok:false,message:'Ce créneau n’est plus disponible pour cette préférence.'};}
    const q=await c.rpc('quote',{p_ids:c.ids(input.service_ids)});
    context.pending={service_ids:input.service_ids,starts:slot.starts,client_name:input.client_name,client_email:input.client_email,client_phone:input.client_phone,quote:q};
    return {ok:false,requires_confirmation:true,message:'Une proposition est affichée sous le message. La cliente doit relire le récapitulatif et cliquer sur Confirmer. Aucun rendez-vous n’est encore créé.'};
  }
  throw new Error('Outil inconnu');
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || (m.role === 'assistant' && typeof m.signature === 'string' && require('./lib/core').safeEqual(m.signature,require('./lib/core').sign('melba-reply:'+m.content)))))
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned.length ? cleaned : null;
}

async function callClaude(apiKey, messages, context) {
  let liveCatalogue='';
  {
    const core=require('./lib/core');
    const [current,hours]=await Promise.all([core.db('br15_services?active=eq.true&order=position.asc'),core.db('br15_hours?order=dow.asc,opens.asc')]);
    liveCatalogue='\nCatalogue serveur à jour, prioritaire pour les noms, prix et durées :\n'+current.map(s=>s.id+' : '+s.path+' — '+s.minutes+' min — '+(s.cents/100)+' €').join('\n');
    const days=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const schedule=days.map((day,dow)=>{const spans=hours.filter(h=>h.dow===dow);return day+' : '+(spans.length?spans.map(h=>h.opens.slice(0,5)+'–'+h.closes.slice(0,5)).join(', '):'fermé');}).join(' ; ');
    context.openingHours=schedule;
    liveCatalogue+='\nHoraires habituels du studio en heure de Paris, lus dans le Manager : '+schedule+'. Ces horaires ne garantissent pas un créneau libre : les absences et rendez-vous doivent être vérifiés avec check_availability.';
  }
  // Réserve une unité AVANT chaque appel : plafond global partagé et atomique.
  const budget=require('./lib/core');
  if(!await budget.rpc('limit',{p_key:'melba-global:'+new Date().toISOString().slice(0,10),p_max:100,p_seconds:86400}))budget.fail(429,'Melba a atteint sa limite quotidienne. Contactez Mélanie.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1100, system: SYSTEM_PROMPT + '\nSélection actuelle du crâne (identifiants du catalogue) : '+JSON.stringify(context.siteSelection||[])+'. Inclure toutes ces prestations pour une demande portant sur cette sélection ; clarifier tout changement avec la cliente.\n' + (context.selectedStart?'\nCréneau retenu par la cliente : '+context.requestedDate+' à '+context.selectedStart+'. Quand la cliente donne son nom, son téléphone et son e-mail, appelle book_appointment avec cette date et cette heure. Ne reproposes pas la liste des horaires.':'')+((context.services||[]).length?'\nPrestations déjà identifiées dans la conversation (ne les redemande pas) : '+context.services.join(', ')+'. Utilise ces identifiants dans check_availability et book_appointment ; demande seulement ce qui manque (date, puis coordonnées).':'')+'\nDate actuelle à Paris : '+policy.today()+' ('+policy.label(policy.today())+'). Fuseau : Europe/Paris.\n' + liveCatalogue + ('\nRègles commerciales confirmées par Mélanie : paiement exclusivement sur place, aucun acompte ni paiement en ligne, y compris lors de la première visite. Plusieurs prestations sont regroupées dans un seul rendez-vous avec prix et durée cumulés.\nMode natif V15 : le clic sur le bouton de confirmation affiché à la cliente crée le rendez-vous. Avant cela, il s’agit uniquement d’une proposition. Ne dis jamais que le rendez-vous est confirmé avant ce clic et son résultat serveur.'), tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error('API Claude ' + res.status);
  return res.json();
}

// Vérifie dans le calendrier réel le créneau désigné par la cliente, puis demande ses coordonnées.
// Aucune écriture ici : la réservation reste soumise à l'accord et au clic de confirmation.
async function selectionReply(time, context, date) {
  const c = require('./lib/core');
  const services = context.siteSelection;
  const slots = await calendarAvailability(date, services, context);
  const label = policy.label(date);
  const slot = slots.find(x => policy.time(x.starts) === time);
  if (!slot) {
    return { reply: 'Cet horaire n’est plus disponible le ' + label + '. Souhaitez-vous un autre horaire ? Aucun rendez-vous n’a été enregistré. ♡', bookingContext: { date, preference: context.preference || null } };
  }
  const preference = Number(time.slice(0, 2)) < 12 ? 'morning' : 'afternoon';
  const q = await c.rpc('quote', { p_ids: c.ids(services) });
  return {
    reply: 'Très bien, je note le ' + label + ' à ' + time + ' pour vos prestations (' + q.minutes + ' min au total). Pour réserver ce créneau, indiquez-moi votre nom, votre numéro de téléphone et votre adresse e-mail. Aucun rendez-vous n’est encore enregistré. ♡',
    bookingContext: { date, preference, start: time },
  };
}

// Mode conseil : réponses de conseil uniquement, sans outil ni créneau ni réservation.
const ADVISOR_HINT='\nMode conseillère : répondez aux questions de conseil (prestations, techniques, entretien, tarifs, questions diverses) avec le ton de Melba. Ne proposez aucun créneau, ne réservez rien et ne demandez aucune coordonnée. Si la cliente veut réserver, invitez-la à le dire clairement.';
async function callAdvisor(apiKey, messages){
  const core=require('./lib/core');
  if(!await core.rpc('limit',{p_key:'melba-global:'+new Date().toISOString().slice(0,10),p_max:100,p_seconds:86400}))core.fail(429,'Melba a atteint sa limite quotidienne. Contactez Mélanie.');
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:700,system:SYSTEM_PROMPT+ADVISOR_HINT,messages:messages.map(m=>({role:m.role,content:m.content}))})});
  if(!res.ok)throw new Error('API Claude '+res.status);
  const data=await res.json();
  const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
  return text||'Je peux vous renseigner sur les prestations, les tarifs et l’entretien. Souhaitez-vous réserver ? ♡';
}

async function handleChat(event, ctx = {}) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Méthode non autorisée' });

  const core=require('./lib/core');
  try { core.origin(event); await core.rate(event,'melba',30); } catch(err) { return core.json(err.status||503,{error:err.status?err.message:'Assistante indisponible'}); }
  const context={pending:null};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'Assistante non configurée' });

  let payload;
  try {
    payload = core.body(event);
  } catch {
    return json(400, { error: 'Requête invalide' });
  }

  const messages = cleanMessages(payload.messages);
  if (!messages || messages.at(-1).role!=='user') return json(400, { error: 'Aucun message' });
  // Contexte minimal signé : conserve la date alternative vérifiée, sans coordonnées.
  let previous=null;
  if(payload.bookingContext&&typeof payload.contextSignature==='string'){
    const serialized=JSON.stringify(payload.bookingContext);
    if(serialized.length<500&&core.safeEqual(payload.contextSignature,core.sign('melba-context:'+serialized)))previous=payload.bookingContext;
  }
  try{context.siteSelection=Array.isArray(payload.selected_service_ids)&&payload.selected_service_ids.length?core.ids(payload.selected_service_ids):[];}catch{return json(400,{error:'Sélection de prestations invalide'});}
  const last=[messages.at(-1)];
  context.openingQuestion=/horaires? (?:d['’]ouverture|du studio)|heures? d['’]ouverture|quels sont vos horaires|ouvrez.vous/i.test(last[0].content);
  Object.assign(context,policy.planningContext(messages,previous));
  const direct=policy.directReply(messages.at(-1).content);
  // Mode conseil ou réservation, choisi par la cliente ; le mode est conservé dans le contexte signé.
  const plain=String(last[0].content||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’`]/g,"'");
  const wantsBooking=/\b(reserver|reservation|rendez.?vous|rdv)\b/.test(plain);
  const wantsAdvice=!wantsBooking&&/\b(conseil\w*|conseill\w*|lequel me|laquelle me)\b/.test(plain);
  const prevMode=previous?.mode||null;
  if(!prevMode&&messages.length===1&&/^(bonjour|bonsoir|salut|hello|coucou)[\s!.,?]*$/.test(plain.trim())){
    // Même plafond IA que les autres messages, même avant la salutation.
    if(!await core.rpc('limit',{p_key:'melba-global:'+new Date().toISOString().slice(0,10),p_max:100,p_seconds:86400}))return json(429,{error:'Melba a atteint sa limite quotidienne. Contactez Mélanie.'});
    const reply='Bonjour ! Vous avez besoin d’un conseil ou vous souhaitez réserver ? ♡';
    return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply)});
  }
  const mode=wantsBooking?'reservation':wantsAdvice?'conseil':(prevMode||'reservation');
  if(mode==='conseil'){
    let text;
    try{text=await callAdvisor(apiKey,messages);}catch(err){return json(err.status===429?429:502,{error:err.status===429?err.message:'Réponse indisponible, réessayez ou appelez Mélanie.'});}
    const reply=(wantsAdvice&&prevMode!=='conseil'?'Je passe en mode conseillère. ':'')+text;
    const bc={...(previous||{}),mode:'conseil'};
    return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),bookingContext:bc,contextSignature:core.sign('melba-context:'+JSON.stringify(bc))});
  }
  if(wantsBooking&&prevMode==='conseil')ctx.modeNote='Je passe en mode agent de réservation. ';
  if(direct)return json(200,{pendingBooking:null,reply:direct,signature:core.sign('melba-reply:'+direct)});
  // Prestations nommées par la cliente : retenues dans le contexte signé, jamais redemandées.
  const lastAssistant=[...messages].reverse().find(m=>m.role==='assistant'&&typeof m.content==='string');
  const familyAsked=(lastAssistant?.content||'').match(/Dans « (.+?) », quelle option souhaitez-vous/);
  const mention=policy.matchServices(last[0].content,CATALOGUE,familyAsked?familyAsked[1]:null);
  const serviceIds=mention.ids.length?mention.ids:(Array.isArray(previous?.services)?previous.services.filter(x=>CATALOGUE.some(s=>s.id===x)):[]);
  const signedContext=(fields)=>{const bc={mode:'reservation',...fields,...(serviceIds.length?{services:serviceIds}:{})};return {bookingContext:bc,contextSignature:core.sign('melba-context:'+JSON.stringify(bc))};};
  if(mention.ambiguous){
    const reply=mention.ambiguousFamily
      ?'Dans « '+mention.ambiguousFamily+' », quelle option souhaitez-vous : '+mention.ambiguous.join(', ')+' ? ♡'
      :'Plusieurs prestations correspondent à votre demande : '+mention.ambiguous.join(' ou ')+'. Laquelle souhaitez-vous ? ♡';
    return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),...signedContext({date:previous?.date||null,preference:context.preference||null})});
  }
  if(!context.siteSelection.length&&serviceIds.length)context.siteSelection=serviceIds;
  context.services=serviceIds;
  // Date seule manquante : réponse serveur directe, sans reposer la question de la prestation ni de la préférence.
  const lastText=last[0].content,prefKnown=context.preference==='morning'||context.preference==='afternoon'||context.preference==='any';
  if(serviceIds.length&&!context.requestedDate&&!policy.hasDateExpression(lastText)&&lastText.length<=160&&!/\?/.test(lastText)&&(mention.ids.length||context.preference==='morning'||context.preference==='afternoon')){
    const names=CATALOGUE.filter(s=>serviceIds.includes(s.id)).map(s=>policy.serviceLabel(s,CATALOGUE)).join(' + ');
    const prefWord=context.preference==='morning'?'le matin':context.preference==='afternoon'?'l’après-midi':'';
    const head=mention.ids.length?'Très bien, '+names+(prefWord?', '+prefWord:'')+'. ':'Très bien, '+prefWord+'. ';
    // Une seule question à la fois : la date d'abord, la période (matin ou après-midi) après le calendrier.
    const tail='Quelle date vous conviendrait ?';
    const reply=head+tail+' ♡';
    return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),...signedContext({date:null,preference:context.preference||null})});
  }
  // Créneau désigné : « 10h40 », ou « Le 27 octobre à 10h40 » (la date du message prime sur la mémoire).
  const picked=policy.selectedTime(lastText)||(policy.hasDateExpression(lastText)?policy.timeAfterA(lastText):null);
  if(picked&&context.requestedDate&&context.siteSelection.length){
    try{
      const chosen=await selectionReply(picked,context,context.requestedDate);
      const ctxOut=signedContext(chosen.bookingContext);
      return json(200,{pendingBooking:null,reply:chosen.reply,signature:core.sign('melba-reply:'+chosen.reply),...ctxOut});
    }catch(err){
      console.error('Sélection de créneau en erreur', err.message);
      const reply='Je ne peux pas vérifier le calendrier pour le moment. Aucun rendez-vous n’a été enregistré. Réessayez un peu plus tard ou contactez Mélanie au 06 62 28 75 45. 💕';
      return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply)});
    }
  }
  // Créneau déjà retenu : coordonnées, récapitulatif, puis confirmation par clic uniquement.
  const haveSlot=Boolean(previous?.start&&previous.date&&context.requestedDate===previous.date&&serviceIds.length);
  const contactNow=policy.contactFrom(lastText),nameNow=policy.isNameAnswer(messages),hasContactNow=Object.keys(contactNow).length>0||nameNow;
  const recapAsk=policy.isRecapRequest(lastText),confirmAsk=policy.isConfirmWord(lastText);
  if(haveSlot&&(hasContactNow||recapAsk||confirmAsk)){
    if(confirmAsk&&!hasContactNow){
      const reply='Je ne peux pas confirmer le rendez-vous depuis le chat. Cliquez sur le bouton Confirmer sous le récapitulatif pour le valider. Aucun rendez-vous n’est encore enregistré. ♡';
      return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),...signedContext({date:previous.date,preference:context.preference||null,start:previous.start})});
    }
    const contact=policy.contactFromHistory(messages);
    const labels={name:'votre nom',phone:'votre numéro de téléphone',email:'votre adresse e-mail'};
    const missing=['name','phone','email'].filter(k=>!contact[k]).map(k=>labels[k]);
    if(missing.length){
      const reply='Pour préparer le récapitulatif, il me manque encore '+missing.join(', puis ')+'. ♡';
      return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),...signedContext({date:previous.date,preference:context.preference||null,start:previous.start})});
    }
    try{
      await nativeRunTool('book_appointment',{date:previous.date,start:previous.start,service_ids:serviceIds,client_name:contact.name,client_phone:contact.phone,client_email:contact.email},context);
      const ctxOut=signedContext({date:previous.date,preference:context.preference||null,start:previous.start});
      if(context.pending){
        const q=context.pending.quote||{};
        const names=CATALOGUE.filter(s=>serviceIds.includes(s.id)).map(s=>s.name).join(' + ');
        const euros=String(Number(q.cents||0)/100).replace('.',',');
        const reply='Voici le récapitulatif de votre demande : '+names+', '+euros+' € pour '+q.minutes+' min, '+policy.label(previous.date)+' à '+previous.start+'. Au nom de '+contact.name+' ('+contact.phone+', '+contact.email+'). Aucun rendez-vous n’est encore enregistré : vérifiez ces informations, puis cliquez sur Confirmer pour valider la réservation. ♡';
        return json(200,{pendingBooking:context.pending,reply,signature:core.sign('melba-reply:'+reply),...ctxOut});
      }
      const reply='Ce créneau n’est plus disponible pour cette préférence. Aucun rendez-vous n’a été enregistré. Souhaitez-vous un autre horaire ? ♡';
      return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply),...signedContext({date:previous.date,preference:context.preference||null})});
    }catch(err){
      console.error('Récapitulatif en erreur', err.message);
      const reply='Je ne peux pas vérifier le calendrier pour le moment. Aucun rendez-vous n’a été enregistré. Réessayez un peu plus tard ou contactez Mélanie au 06 62 28 75 45. 💕';
      return json(200,{pendingBooking:null,reply,signature:core.sign('melba-reply:'+reply)});
    }
  }
  context.selectedStart=previous?.start&&previous.date===context.requestedDate?previous.start:null;

  try {
    let data = await callClaude(apiKey, messages, context);

    for (let round = 0; round < MAX_TOOL_ROUNDS && data.stop_reason === 'tool_use'; round++) {
      messages.push({ role: 'assistant', content: data.content });
      const results = [];
      for (const block of data.content.filter(b => b.type === 'tool_use')) {
        let output;
        try {
          output = await nativeRunTool(block.name, block.input,context);
        } catch (err) {
          context.toolError=true;context.pending=null;
          console.error('Outil en erreur', block.name);
          output = { error: 'Service de réservation momentanément indisponible. Demandez à la cliente d\'appeler Mélanie.' };
        }
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) });
      }
      messages.push({ role: 'user', content: results });
      data = await callClaude(apiKey, messages, context);
    }

    let reply = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if(!reply && !context.pending){
      console.warn('Melba: réponse sans texte, stop_reason='+String(data.stop_reason));
      const retry=await callClaude(apiKey,[...messages,{role:'user',content:'Merci de répondre directement à la dernière question de la cliente, en français et sans utiliser d’outil si ce n’est pas nécessaire.'}],context);
      reply=(retry.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n').trim();
    }
    const finalReply=policy.guardedReply(reply,context) || 'Je rencontre un souci pour formuler ma réponse. Peux-tu reformuler ta question ?';
    const bookingContext={mode:'reservation',date:context.availability?.date||context.requestedDate,preference:context.preference,...(context.selectedStart&&!context.availability?.alternative&&context.selectedStart&&!context.bookingRejected?{start:context.selectedStart}:{}),...(serviceIds.length?{services:serviceIds}:{})};
    return json(200, {pendingBooking:context.pending,reply:finalReply,signature:core.sign('melba-reply:'+finalReply),bookingContext,contextSignature:core.sign('melba-context:'+JSON.stringify(bookingContext))});
  } catch (err) {
    console.error('Erreur', err.message);
    return json(err.status===429?429:502, {error:err.status===429?err.message:'Réponse indisponible, réessayez ou appelez Mélanie.'});
  }
};

// Annonce de changement de mode, ajoutée à la réponse et resignée.
exports.handler = async (event) => {
  const ctx = {};
  const res = await handleChat(event, ctx);
  if (ctx.modeNote && res.statusCode === 200) {
    const body = JSON.parse(res.body);
    body.reply = ctx.modeNote + body.reply;
    body.signature = require('./lib/core').sign('melba-reply:' + body.reply);
    res.body = JSON.stringify(body);
  }
  return res;
};

exports._test={cleanMessages,nativeRunTool,selectionReply,SYSTEM_PROMPT,TOOLS};
