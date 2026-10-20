/* Essais réels de notifications — PRÉPRODUCTION UNIQUEMENT.

   Par défaut, toute notification de préproduction est simulée (lib/notifications.js).
   Une réservation n'envoie de vrais e-mail (Resend) et SMS (Brevo) de confirmation que si
   l'opérateur la marque explicitement en base : br15_bookings.real_test_until = instant
   d'expiration. Le destinataire est celui saisi par la cliente sur cette réservation.

   Garde-fous :
   - APP_ENV=preproduction obligatoire (la production n'est jamais concernée) ;
   - marquage par réservation, expiration automatique à real_test_until ;
   - un seul envoi réel par réservation et par canal, toutes révisions confondues ;
   - plafond quotidien global, toutes réservations confondues ;
   - uniquement la confirmation ; rappels, Manager, Outlook, modifications et annulations restent simulés ;
   - aucune variable Netlify à régler : désactiver = remettre real_test_until à null. */
const c=require('./core');
const KINDS={'email-client':'email','sms-confirmation':'sms'};
const DAILY_CAP=5;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,PHONE=/^\+33[1-9]\d{8}$/;

// Vrai si la réservation est marquée pour un essai réel et que la fenêtre n'a pas expiré.
function marked(b,now=Date.now()){
 const until=Date.parse((b&&b.real_test_until)||'');
 return Number.isFinite(until)&&now<until;
}

// Vrai si ce job précis peut partir réellement. Appelé uniquement en préproduction.
async function allowed(j,b){
 if(process.env.APP_ENV!=='preproduction')return false;
 const kind=KINDS[j.kind];
 if(!kind)return false;                                              // rappels, Manager, Outlook : simulés
 if((j.payload&&j.payload.event||'confirmation')!=='confirmation')return false;
 if(!b||b.status!=='confirme'||!marked(b))return false;
 const client=(await c.db('br15_clients?id=eq.'+b.client_id))[0];
 if(!client)return false;
 if(kind==='email'&&!EMAIL.test(String(client.email||'')))return false;
 if(kind==='sms'&&!PHONE.test(String(client.phone||'')))return false;
 // Un seul envoi réel par réservation et par canal : tout envoi réel parti, en cours ou incertain bloque le suivant.
 const sameBooking=await c.db('br15_jobs?booking_id=eq.'+b.id+'&kind=eq.'+j.kind+'&id=neq.'+j.id+'&state=in.(sending,sent,uncertain)&or=(provider_id.is.null,provider_id.neq.preprod-simulated)&select=id');
 if(sameBooking.length)return false;
 // Plafond quotidien global : les envois réels des dernières 24 h, tous canaux confondus pour ce type.
 const since=new Date(Date.now()-86400000).toISOString();
 const today=await c.db('br15_jobs?kind=eq.'+j.kind+'&id=neq.'+j.id+'&claimed_at=gte.'+since+'&state=in.(sending,sent,uncertain)&or=(provider_id.is.null,provider_id.neq.preprod-simulated)&select=id');
 return today.length<DAILY_CAP;
}

module.exports={marked,allowed,DAILY_CAP};
