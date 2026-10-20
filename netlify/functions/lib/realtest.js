/* Mode de test « réservation réelle » — PRÉPRODUCTION UNIQUEMENT, désactivé par défaut.

   Autorise au plus UN e-mail de confirmation (Resend) et UNE SMS de confirmation (Brevo),
   et seulement pour une réservation créée après l'activation dont la cliente correspond
   exactement à l'e-mail ET au téléphone autorisés. Tout le reste (autres clientes, rappels,
   e-mail Manager, modifications, annulations, Outlook) reste simulé.

   Activation (variables Netlify de préproduction, jamais en production) :
   PREPROD_REAL_TEST=true
   PREPROD_REAL_TEST_EMAIL=fiteleny@gmail.com
   PREPROD_REAL_TEST_PHONE=+33677600688
   PREPROD_REAL_TEST_SINCE=<instant ISO d'activation>
   PREPROD_REAL_TEST_UNTIL=<instant ISO d'expiration>  (passé cette date, tout redevient simulé) */
const c=require('./core');
const KINDS={'email-client':'email','sms-confirmation':'sms'};
const norm=x=>String(x||'').trim().toLowerCase();
const digits=x=>String(x||'').replace(/\s/g,'');
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,PHONE=/^\+33[1-9]\d{8}$/;

function config(){
 return {
  on:process.env.APP_ENV==='preproduction'&&process.env.PREPROD_REAL_TEST==='true',
  email:norm(process.env.PREPROD_REAL_TEST_EMAIL),
  phone:digits(process.env.PREPROD_REAL_TEST_PHONE),
  since:Date.parse(process.env.PREPROD_REAL_TEST_SINCE||''),
  until:Date.parse(process.env.PREPROD_REAL_TEST_UNTIL||''),
 };
}

// Vrai seulement si le mode est activé, valide et non expiré.
function active(now=Date.now()){
 const k=config();
 return k.on&&EMAIL.test(k.email)&&PHONE.test(k.phone)&&Number.isFinite(k.since)&&Number.isFinite(k.until)&&now<k.until;
}

// Vrai si ce job précis peut partir réellement. Appelé uniquement en préproduction.
async function allowed(j,b){
 if(!active())return false;
 const kind=KINDS[j.kind];
 if(!kind)return false;                                  // rappels, Manager, Outlook : toujours simulés
 if((j.payload&&j.payload.event||'confirmation')!=='confirmation')return false;
 if(!b||b.status!=='confirme')return false;
 const k=config();
 if(!(Date.parse(b.created_at)>=k.since))return false;   // réservation créée après l'activation seulement
 const client=(await c.db('br15_clients?id=eq.'+b.client_id))[0];
 if(!client||norm(client.email)!==k.email||digits(client.phone)!==k.phone)return false;
 // Un seul envoi réel par canal : tout autre envoi réel parti, en cours ou incertain bloque le suivant.
 // Les envois simulés (provider_id = preprod-simulated) ne comptent pas.
 const prior=await c.db('br15_jobs?kind=eq.'+j.kind+'&id=neq.'+j.id+'&state=in.(sending,sent,uncertain)&or=(provider_id.is.null,provider_id.neq.preprod-simulated)&select=id');
 return prior.length===0;
}

module.exports={config,active,allowed,_test:{norm,digits}};
