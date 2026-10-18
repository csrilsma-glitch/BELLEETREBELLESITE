/* Récupération privée : aucun jeton dans la réponse JSON ou les journaux. */
const c=require('./lib/core');
function recoveryCookie(value,seconds=600){return c.cookie('br15_recovery',value,seconds);}
async function allowed(token){
 const user=await c.authRequest('user',{token});
 if(!c.uuid(user.id))c.fail(401,'Lien invalide ou expiré');
 const rows=await c.db('br15_managers?user_id=eq.'+encodeURIComponent(user.id)+'&active=eq.true');
 if(!rows.length)c.fail(403,'Compte non autorisé au Manager');return user;
}
function aal(token){try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).aal;}catch{return null;}}
function session(e){const value=c.cookies(e).br15_recovery;if(!value)c.fail(401,'Ouvrez le lien de récupération reçu par e-mail');let s;try{s=c.unseal(value);}catch{c.fail(401,'Lien invalide ou expiré');}if(!s.expires||s.expires<Date.now())c.fail(401,'Session de récupération expirée');return s;}
exports.handler=e=>c.wrap(e,async()=>{
 if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});
 await c.rate(e,'manager-recovery',10);const d=c.body(e);
 if(d.action==='start'){
  if(typeof d.access_token!=='string'||d.access_token.length>8000)c.fail(400,'Lien invalide');
  const user=await allowed(d.access_token),factor=(user.factors||[]).find(x=>x.factor_type==='totp'&&x.status==='verified');
  const s={token:d.access_token,user_id:user.id,expires:Date.now()+600000};
  return c.json(200,{ok:true,mfa_required:!!factor&&aal(s.token)!=='aal2'},{'Set-Cookie':recoveryCookie(c.seal(s))});
 }
 const s=session(e),user=await allowed(s.token);if(user.id!==s.user_id)c.fail(401,'Session invalide');
 const factor=(user.factors||[]).find(x=>x.factor_type==='totp'&&x.status==='verified');
 if(d.action==='verify'){
  if(!factor||!/^\d{6}$/.test(d.code||''))c.fail(400,'Code de sécurité invalide');
  const ch=await c.authRequest('factors/'+factor.id+'/challenge',{method:'POST',token:s.token,data:{}});
  const verified=await c.authRequest('factors/'+factor.id+'/verify',{method:'POST',token:s.token,data:{challenge_id:ch.id,code:d.code}});
  if(!verified.access_token||aal(verified.access_token)!=='aal2')c.fail(403,'Code de sécurité requis');
  s.token=verified.access_token;
  return c.json(200,{ok:true},{'Set-Cookie':recoveryCookie(c.seal(s),Math.max(0,Math.floor((s.expires-Date.now())/1000)))});
 }
 if(d.action==='reset'){
  if(factor&&aal(s.token)!=='aal2')c.fail(403,'Code de sécurité requis');
  if(typeof d.password!=='string'||d.password.length<12||d.password.length>128)c.fail(400,'Choisissez un mot de passe de 12 à 128 caractères');
  try{await c.authRequest('user',{method:'PUT',token:s.token,data:{password:d.password}});}catch(err){if(err.status===401)c.fail(400,'Mot de passe refusé : choisissez-en un différent, ou demandez un nouveau lien');throw err;}
  // Invalide les jetons de renouvellement de cette session après l’opération.
  try{await c.authRequest('logout?scope=global',{method:'POST',token:s.token});}catch{}
  return {...c.json(200,{ok:true}),multiValueHeaders:{'Set-Cookie':[recoveryCookie('',0),c.cookie('br15_session','',0)]}};
 }
 c.fail(400,'Action invalide');
});
exports._test={allowed,session,aal};
