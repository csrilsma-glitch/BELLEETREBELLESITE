/* Demande de lien de récupération Manager.
   Réponse identique que le compte existe ou non (pas d’énumération d’adresses).
   La double authentification n’est pas touchée : la réinitialisation reste protégée par manager-recovery.js. */
const c=require('./lib/core');
const GENERIC='Si un accès Manager existe pour cette adresse, un lien de récupération vient d’être envoyé. Pensez à vérifier vos indésirables.';
const normalize=x=>String(x||'').trim().toLowerCase();
const valid=x=>x.length>=5&&x.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
function resetUrl(){return (process.env.SITE_URL||c.PUBLIC)+'/manager/reset-password.html';}
exports.handler=e=>c.wrap(e,async()=>{
 if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});
 const d=c.body(e);
 if(d.action!=='request')c.fail(400,'Action invalide');
 await c.rate(e,'manager-forgot',5);
 const email=normalize(d.email);
 if(!valid(email))c.fail(400,'Adresse e-mail invalide');
 // Limite par adresse : au plus 3 demandes par heure, sans révéler si le compte existe.
 const allowed=await c.rpc('limit',{p_key:'manager-forgot-email:'+c.sha(email),p_max:3,p_seconds:3600});
 // En préproduction, aucun e-mail réel n’est envoyé : la réponse reste identique.
 if(allowed&&process.env.APP_ENV!=='preproduction'){
  try{await c.authRequest('recover?redirect_to='+encodeURIComponent(resetUrl()),{method:'POST',data:{email}});}
  catch(err){console.error('BR15 forgot',err.status||'erreur');}
 }else if(process.env.APP_ENV==='preproduction'){console.log('BR15 forgot simulé en préproduction');}
 return c.json(200,{ok:true,message:GENERIC});
});
exports._test={normalize,valid,resetUrl,GENERIC};
