const c=require('./core'),o=require('./outlook');
async function deliver(j){
 // En préproduction, la file est traitée mais aucun fournisseur e-mail ou SMS n’est appelé : l’envoi est toujours simulé.
 // Aucun chemin d’envoi réel n’existe en préproduction (les essais réels ont été supprimés).
 const simulated=process.env.APP_ENV==='preproduction';
 if(j.kind==='outlook-block')return require('./block-outlook').deliver(j);
 const b=(await c.db('br15_bookings?id=eq.'+j.booking_id))[0];if(!b||b.revision!==j.payload.revision)return {obsolete:true};
 // Une prestation terminée ne notifie personne : tout job « terminé » encore en file est écarté.
 if(j.payload.event==='terminé')return {obsolete:true};
 // Économie Brevo : pas de SMS pour les déplacements/annulations, déjà convenus avec la cliente.
 // Les confirmations initiales et rappels SMS restent possibles selon les réglages.
 const event=j.payload.event||'confirmation';
 if(j.kind.startsWith('sms-')&&!['confirmation','rappel'].includes(event))return {obsolete:true};
 if(j.kind.endsWith('-reminder')&&(b.status!=='confirme'||Date.parse(b.starts)<Date.now()))return {obsolete:true};
 // Outlook : en préproduction, écriture seulement si le compte désigné est confirmé (outlook.testWriteAllowed).
 if(j.kind==='outlook'){if(simulated)return {provider_id:'preprod-simulated'};if(simulated&&!(await o.testWriteAllowed()))return {provider_id:'preprod-simulated'};return {provider_id:await o.push(b)};}
 if(simulated)return {provider_id:'preprod-simulated'};
 const client=(await c.db('br15_clients?id=eq.'+b.client_id))[0];
 const when=c.localTime(b.starts);
 const url=c.siteUrl()+'/reservation.html#booking='+b.id+'&token='+c.tokenFor(b.request_key);
 const text=`Belle & Rebelle — ${event}\n${client.name}, votre rendez-vous : ${when}.\n${b.services.map(x=>x.path).join('\n')}\nTotal : ${(b.cents/100).toFixed(2)} € — paiement sur place, sans acompte.\n${b.status==='annule'?'Rendez-vous annulé.':'Gérer mon rendez-vous : '+url}\nTéléphone : 06 62 28 75 45.`;
 let res;
 if(j.kind.startsWith('email-')){
 const data={from:process.env.MAIL_FROM||'Belle & Rebelle <reservation@belleetrebelle-nailstudio.fr>',to:[j.kind==='email-manager'?'belleetrebelle.flers@outlook.com':client.email],subject:`Belle & Rebelle — ${event}`,text:text+(j.kind==='email-manager'?'\nContact cliente : '+client.phone+' / '+client.email:''),attachments:[{filename:'rendez-vous.ics',content:Buffer.from(c.ics(b)).toString('base64')}]};
 res=await c.request('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+c.env('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':j.dedupe},body:JSON.stringify(data)});
 }else{
 // Même endpoint/expéditeur que la fonction Brevo reçue et déjà testée.
 // Clé lue avant tout appel : une erreur de configuration ne doit jamais compter comme envoi.
 const brevoKey=c.env('BREVO_API_KEY');
 j.provider_called=true;
 res=await c.request('https://api.brevo.com/v3/transactionalSMS/sms',{method:'POST',headers:{'api-key':brevoKey,'Content-Type':'application/json'},body:JSON.stringify({sender:'BELREBELLE',recipient:client.phone,content:`Belle & Rebelle : ${event} du RDV ${when}. ${b.status==='annule'?'Annule.':'Sans acompte. Infos : 06 62 28 75 45.'}`,type:'transactional',tag:'br15-'+j.id})});
 }
 if(!res.ok){const err=new Error('Fournisseur '+res.status);err.definite=res.status>=400&&res.status<500&&res.status!==408;throw err;}
 const data=await res.json().catch(()=>({}));return {provider_id:String(data.id||data.messageId||'accepted')};
}
async function run(){const results=[],deadline=Date.now()+18000;
 // Vider les rafales de confirmations/modifications sans dépasser le budget de 18 s.
 for(let n=0;n<24&&Date.now()<deadline;n++){const jobs=await c.rpc('claim',{});if(!jobs.length)break;const j=jobs[0];try{
 const result=await deliver(j);if(result.deferred){await c.db('br15_jobs?id=eq.'+j.id,{method:'PATCH',data:{state:'pending',attempts:Math.max(0,j.attempts-1),run_at:new Date(Date.now()+300000).toISOString(),error:'Synchronisation Outlook en attente d’autorisation'}});results.push({id:j.id,state:'pending'});continue;}await c.db('br15_jobs?id=eq.'+j.id,{method:'PATCH',data:{state:result.obsolete?'obsolete':'sent',provider_id:result.provider_id||null,error:null}});results.push({id:j.id,state:result.obsolete?'obsolete':'sent'});
 }catch(err){const sms=j.kind.startsWith('sms-'),// Un SMS dont la requête est partie sans réponse claire (timeout, 5xx, 408) peut avoir été accepté : pas de relance aveugle.
 ambiguous=sms&&j.provider_called===true&&!err.definite;const state=ambiguous?'uncertain':'failed';await c.db('br15_jobs?id=eq.'+j.id,{method:'PATCH',data:{state,error:err.status?err.message:'Échec fournisseur ; vérifier avant renvoi',run_at:new Date(Date.now()+Math.min(60,2**j.attempts)*60000).toISOString()}});results.push({id:j.id,state});}}
 return results;}
module.exports={deliver,run};
