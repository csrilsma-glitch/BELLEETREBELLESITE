(async()=>{
'use strict';const $=id=>document.getElementById(id),status=$('recovery-status');let busy=false;
const hash=new URLSearchParams(location.hash.slice(1));let access=hash.get('access_token');const type=hash.get('type'),error=hash.get('error_description')||new URLSearchParams(location.search).get('error_description');
// Supprime immédiatement tous les jetons de l’historique et ne les conserve jamais en stockage navigateur.
history.replaceState(null,'',location.pathname);
function note(message,failed=false){status.textContent=message;status.className=failed?'error':'';}
async function api(data){const res=await fetch('/.netlify/functions/manager-recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});const d=await res.json();if(!res.ok)throw Error(d.error||'Récupération indisponible');return d;}
async function run(form,fn){if(busy)return;busy=true;form.querySelector('button').disabled=true;try{await fn();}catch(e){note(e.message,true);}finally{busy=false;form.querySelector('button').disabled=false;}}
if(error||!access||type!=='recovery'){$('recovery-help').hidden=false;note(error?'Le lien a expiré ou a déjà été utilisé. Demandez un nouvel e-mail.':'Ouvrez cette page avec le lien de récupération reçu par e-mail.',true);return;}
try{const response=await api({action:'start',access_token:access});access=null;hash.delete('access_token');hash.delete('refresh_token');$('recovery-mfa').hidden=!response.mfa_required;$('recovery-password').hidden=response.mfa_required;note(response.mfa_required?'Saisissez votre code de sécurité.':'Lien vérifié. Choisissez un nouveau mot de passe.');}catch(e){access=null;note(e.message,true);$('recovery-help').hidden=false;return;}
$('recovery-mfa-form').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{const code=new FormData(e.target).get('code');await api({action:'verify',code});e.target.reset();$('recovery-mfa').hidden=true;$('recovery-password').hidden=false;note('Code vérifié. Choisissez un nouveau mot de passe.');});};
$('recovery-form').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{const f=new FormData(e.target),password=f.get('password');if(password!==f.get('confirmation'))throw Error('Les deux mots de passe ne correspondent pas.');await api({action:'reset',password});e.target.reset();$('recovery-password').hidden=true;note('Votre mot de passe Manager est modifié. Revenez à la connexion pour vous identifier.');});};
})();
