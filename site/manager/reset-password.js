(async()=>{
'use strict';
const $=id=>document.getElementById(id),status=$('recovery-status');let busy=false;
const hash=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams(location.search);
let access=hash.get('access_token');const type=hash.get('type');
const errorCode=hash.get('error_code')||query.get('error_code');
const errorDescription=hash.get('error_description')||query.get('error_description');
// Supprime immédiatement les jetons de l’historique ; ils ne sont jamais conservés dans le navigateur.
history.replaceState(null,'',location.pathname);
function note(message,failed=false){status.textContent=message;status.className=failed?'error':'';}
function needNewLink(message){
 for(const id of ['recovery-mfa','recovery-password'])$(id).hidden=true;
 $('recovery-help').hidden=false;note(message,true);
}
async function api(data){
 const res=await fetch('/.netlify/functions/manager-recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
 const d=await res.json().catch(()=>({}));
 if(!res.ok){const err=Error(d.error||'Récupération indisponible');err.status=res.status;throw err;}
 return d;
}
async function run(form,fn){
 if(busy)return;busy=true;const button=form.querySelector('button');button.disabled=true;
 try{await fn();}
 catch(e){
  // Session de récupération expirée ou lien consommé : il faut un nouveau lien, sans message technique.
  if(e.status===401)needNewLink('Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau depuis la page de connexion.');
  else note(e.message,true);
 }
 finally{busy=false;button.disabled=false;}
}
// Lien expiré, déjà utilisé ou incomplet : message clair, sans détail technique.
if(errorCode||errorDescription||!access||type!=='recovery'){
 const expired=errorCode==='otp_expired';
 needNewLink(errorCode||errorDescription||access
  ?(expired?'Ce lien a expiré. Demandez-en un nouveau depuis la page de connexion.':'Ce lien n’est plus valide ou a déjà été utilisé. Demandez-en un nouveau depuis la page de connexion.')
  :'Ouvrez cette page depuis le lien reçu par e-mail.');
 return;
}
try{
 const response=await api({action:'start',access_token:access});
 access=null;hash.delete('access_token');hash.delete('refresh_token');
 $('recovery-mfa').hidden=!response.mfa_required;$('recovery-password').hidden=response.mfa_required;
 note(response.mfa_required?'Saisissez votre code de sécurité.':'Lien vérifié. Choisissez un nouveau mot de passe.');
}catch(e){
 access=null;
 needNewLink('Ce lien n’est plus valide ou a déjà été utilisé. Demandez-en un nouveau depuis la page de connexion.');
 return;
}
$('recovery-mfa-form').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{
 const code=new FormData(e.target).get('code');
 await api({action:'verify',code});
 e.target.reset();$('recovery-mfa').hidden=true;$('recovery-password').hidden=false;
 note('Code vérifié. Choisissez un nouveau mot de passe.');
});};
$('recovery-form').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{
 const f=new FormData(e.target),password=f.get('password');
 if(password!==f.get('confirmation'))throw Error('Les deux mots de passe ne correspondent pas.');
 await api({action:'reset',password});
 e.target.reset();$('recovery-password').hidden=true;
 note('Votre mot de passe Manager est modifié. Reconnectez-vous avec votre mot de passe et votre code de sécurité.');
 $('recovery-done').hidden=false;
});};
})();
