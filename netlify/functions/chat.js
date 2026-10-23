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
    body: JSON.stringify({ model: MODEL, max_tokens: 1100, system: SYSTEM_PROMPT + '\nSélection actuelle du crâne (identifiants du catalogue) : '+JSON.stringify(context.siteSelection||[])+'. Inclure toutes ces prestations pour une demande portant sur cette sélection ; clarifier tout changement avec la cliente.\n' + '\nDate actuelle à Paris : '+policy.today()+' ('+policy.label(policy.today())+'). Fuseau : Europe/Paris.\n' + liveCatalogue + ('\nRègles commerciales confirmées par Mélanie : paiement exclusivement sur place, aucun acompte ni paiement en ligne, y compris lors de la première visite. Plusieurs prestations sont regroupées dans un seul rendez-vous avec prix et durée cumulés.\nMode natif V15 : le clic sur le bouton de confirmation affiché à la cliente crée le rendez-vous. Avant cela, il s’agit uniquement d’une proposition. Ne dis jamais que le rendez-vous est confirmé avant ce clic et son résultat serveur.'), tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error('API Claude ' + res.status);
  return res.json();
}

exports.handler = async (event) => {
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
  if(direct)return json(200,{pendingBooking:null,reply:direct,signature:core.sign('melba-reply:'+direct)});

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
    const bookingContext={date:context.availability?.date||context.requestedDate,preference:context.preference};
    return json(200, {pendingBooking:context.pending,reply:finalReply,signature:core.sign('melba-reply:'+finalReply),bookingContext,contextSignature:core.sign('melba-context:'+JSON.stringify(bookingContext))});
  } catch (err) {
    console.error('Erreur', err.message);
    return json(err.status===429?429:502, {error:err.status===429?err.message:'Réponse indisponible, réessayez ou appelez Mélanie.'});
  }
};

exports._test={cleanMessages,nativeRunTool,SYSTEM_PROMPT,TOOLS};
