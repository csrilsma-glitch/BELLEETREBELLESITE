const c=require('./lib/core');
// Messages distincts : facteur absent, enrôlement incomplet, code TOTP invalide.
const MSG={
 absent:'Aucun facteur de sécurité n’est enregistré pour ce compte. Cliquez sur « Configurer l’Authenticator » pour recommencer.',
 incomplet:'La configuration de l’Authenticator n’est pas terminée. Saisissez le code à 6 chiffres affiché dans votre application, ou recommencez la configuration.',
 totp:'Code TOTP invalide ou expiré. Attendez le code suivant et vérifiez que l’heure de votre téléphone est réglée automatiquement.',
 verifie:'Un facteur est déjà configuré pour ce compte. Il ne peut pas être remplacé depuis cet écran.',
 defaut:'Vérification impossible pour le moment. Réessayez ; si le problème continue, prévenez l’administrateur.'
};
const isTotp=f=>f&&f.factor_type==='totp';
exports.handler=e=>c.wrap(e,async()=>{
 if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});const d=c.body(e);
 await c.rate(e,'manager-auth',30);
 if(d.action==='logout')return c.json(200,{ok:true},{'Set-Cookie':c.cookie('br15_session','',0)});
 if(d.action==='login'){
 await c.rate(e,'login',10);
 const a=await c.authRequest('token?grant_type=password',{method:'POST',data:{email:d.email,password:d.password}});
 const rows=await c.db('br15_managers?user_id=eq.'+a.user.id+'&active=eq.true');if(!rows.length)c.fail(403,'Accès refusé');
 return c.json(200,{ok:true,mfa_required:true},{'Set-Cookie':c.cookie('br15_session',a.access_token,a.expires_in||3600)});
 }
 const {user,token}=await c.manager(e,{mfa:false});
 const factors=user.factors||[];
 if(d.action==='factors')return c.json(200,{factors:factors.map(f=>({id:f.id,status:f.status,factor_type:f.factor_type}))});
 if(d.action==='enroll'){
 // Un facteur vérifié n’est jamais remplacé ici.
 if(factors.some(f=>isTotp(f)&&f.status==='verified'))c.fail(409,MSG.verifie);
 // Seuls les enrôlements non vérifiés, restés en attente, sont retirés avant un nouvel enrôlement.
 for(const f of factors.filter(f=>isTotp(f)&&f.status!=='verified')){
 const del=await c.authRaw('factors/'+f.id,{method:'DELETE',token});
 console.error('BR15 mfa enroll-clean',del.status,del.data.error_code||'');
 if(!del.ok)c.fail(409,MSG.incomplet);
 }
 const r=await c.authRaw('factors',{method:'POST',token,data:{factor_type:'totp',friendly_name:'Manager Belle Rebelle'}});
 if(!r.ok||!r.data.id){console.error('BR15 mfa enroll',r.status,r.data.error_code||'');c.fail(400,MSG.defaut);}
 return c.json(200,{id:r.data.id,totp:r.data.totp});
 }
 if(d.action==='verify'){
 if(!c.uuid(d.factor_id)||!/^\d{6}$/.test(d.code||''))c.fail(400,'Saisissez le code à 6 chiffres affiché dans votre application.');
 // Le facteur vient d’être créé pendant l’enrôlement : sa présence est vérifiée par Supabase lui-même.
 const known=factors.find(f=>f.id===d.factor_id&&isTotp(f));
 const enrolling=!known||known.status!=='verified';
 const ch=await c.authRaw('factors/'+d.factor_id+'/challenge',{method:'POST',token,data:{}});
 if(!ch.ok||!ch.data.id){
 console.error('BR15 mfa challenge',ch.status,ch.data.error_code||'');
 if(ch.status===404)c.fail(400,MSG.absent);
 c.fail(400,enrolling?MSG.incomplet:MSG.defaut);
 }
 const v=await c.authRaw('factors/'+d.factor_id+'/verify',{method:'POST',token,data:{challenge_id:ch.data.id,code:d.code}});
 if(!v.ok){
 console.error('BR15 mfa verify',v.status,v.data.error_code||'',enrolling?'enrolling':'verified');
 if(v.data.error_code==='mfa_verification_failed')c.fail(400,enrolling?'Code TOTP invalide. L’enrôlement n’est pas encore terminé : saisissez le code affiché dans votre application.':MSG.totp);
 c.fail(400,enrolling?MSG.incomplet:MSG.defaut);
 }
 return c.json(200,{ok:true},{'Set-Cookie':c.cookie('br15_session',v.data.access_token,v.data.expires_in||3600)});
 }
 c.fail(400,'Action invalide');
});
