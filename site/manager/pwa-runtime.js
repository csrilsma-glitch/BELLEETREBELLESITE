/* Seul le shell public est disponible hors ligne. Aucune action métier n'est rejouée. */
(()=>{
'use strict';
const main=document.querySelector('main');
const network=document.createElement('p');network.id='pwa-network';network.setAttribute('role','status');network.setAttribute('aria-live','polite');main.prepend(network);
function state(){network.hidden=navigator.onLine;network.textContent=navigator.onLine?'':'Hors connexion : les données et modifications nécessitent Internet. Aucune action ne sera envoyée automatiquement au retour du réseau.';}
window.addEventListener('offline',state);window.addEventListener('online',state);state();
if(!('serviceWorker' in navigator))return;
let announced=false;
function announce(){
 if(announced)return;announced=true;
 const line=document.createElement('p'),button=document.createElement('button');button.id='pwa-update';button.type='button';button.textContent='Charger la mise à jour';
 line.append('Une nouvelle version est prête. Enregistrez vos modifications avant de la charger. ',button);
 button.addEventListener('click',()=>location.reload());main.prepend(line);
}
navigator.serviceWorker.addEventListener('controllerchange',()=>{if(navigator.serviceWorker.controller)announce();});
navigator.serviceWorker.register('/manager/sw.js',{scope:'/manager/',updateViaCache:'none'}).then(reg=>{
 function update(){if(navigator.onLine)reg.update().catch(()=>{});}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 window.addEventListener('online',update);update();
}).catch(()=>{network.hidden=false;network.textContent='Le mode installé est momentanément indisponible. Le Manager reste accessible dans ce navigateur avec Internet.';});
})();
