/* Aucun accès réseau ni stockage : seul le type du champ est modifié. */
(()=>{
'use strict';
const input=document.getElementById('manager-password'),button=document.getElementById('password-toggle');
if(!input||!button)return;
function conceal(){input.type='password';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Afficher le mot de passe');}
button.addEventListener('click',()=>{
 const visible=input.type==='password';input.type=visible?'text':'password';
 button.setAttribute('aria-pressed',String(visible));
 button.setAttribute('aria-label',visible?'Masquer le mot de passe':'Afficher le mot de passe');
});
input.form.addEventListener('submit',conceal);
input.form.addEventListener('reset',conceal);
window.addEventListener('pagehide',conceal);
})();
