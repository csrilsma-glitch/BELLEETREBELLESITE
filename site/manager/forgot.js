(()=>{
'use strict';
// « Mot de passe oublié ? ♡ » : demande un lien de récupération, sans révéler si l’adresse a un compte.
const $=id=>document.getElementById(id);
const open=$('forgot-open'),panel=$('forgot-panel'),form=$('forgot-form'),status=$('forgot-status'),send=$('forgot-send'),back=$('forgot-back');
if(!open||!panel||!form)return;
let cooldown=null;
function note(message,failed=false){status.textContent=message;status.className=failed?'error':'';}
function setCooling(seconds){
 send.disabled=seconds>0;
 if(seconds<=0){send.textContent='Envoyer le lien';return;}
 send.textContent='Patientez '+seconds+' s';
 cooldown=setTimeout(()=>setCooling(seconds-1),1000);
}
function show(on){
 panel.hidden=!on;
 $('login').hidden=on;
 open.closest('p').hidden=on;
 note('');
 if(on)$('forgot-form').elements.email.focus();
}
open.onclick=()=>{$('forgot-form').elements.email.value=$('login').elements.email.value||'';show(true);};
back.onclick=()=>show(false);
form.onsubmit=async e=>{
 e.preventDefault();
 if(send.disabled)return;
 const email=new FormData(form).get('email');
 try{
  const res=await fetch('/.netlify/functions/manager-forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'request',email}),credentials:'same-origin',cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){note(data.error||'Demande impossible pour le moment. Réessayez plus tard.',true);return;}
  note(data.message||'Si un accès Manager existe pour cette adresse, un lien vient d’être envoyé.');
  form.reset();
  setCooling(60);
 }catch{
  note('Service indisponible. Réessayez dans quelques instants.',true);
 }
};
})();
