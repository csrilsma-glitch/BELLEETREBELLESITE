/* Affichage local uniquement, aucun stockage ni accès réseau. */
(()=>{
'use strict';
document.querySelectorAll('[data-password-toggle]').forEach(button=>{
 const input=document.getElementById(button.getAttribute('aria-controls'));
 if(!input||!input.form)return;
 function conceal(){input.type='password';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Afficher le mot de passe');}
 button.addEventListener('click',()=>{
  const visible=input.type==='password';input.type=visible?'text':'password';
  button.setAttribute('aria-pressed',String(visible));
  button.setAttribute('aria-label',visible?'Masquer le mot de passe':'Afficher le mot de passe');
 });
 input.form.addEventListener('submit',conceal);input.form.addEventListener('reset',conceal);
 window.addEventListener('pagehide',conceal);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)conceal();});
});
})();
