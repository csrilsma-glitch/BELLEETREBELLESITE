/* Installation indépendante de l'authentification. Aucune donnée privée ni stockage. */
(()=>{
'use strict';
const button=document.getElementById('install'),panel=document.getElementById('install-help'),message=document.getElementById('install-message'),steps=document.getElementById('install-steps'),close=document.getElementById('install-close');
if(!button||!panel)return;
let pending=null,installedHere=false,busy=false;
const mode=window.matchMedia('(display-mode: standalone)');
const installed=()=>installedHere||mode.matches||navigator.standalone===true;
function refresh(){button.hidden=installed();if(installed()){panel.hidden=true;button.setAttribute('aria-expanded','false');}}
function guide(text){
 panel.hidden=false;button.setAttribute('aria-expanded','true');
 const ua=navigator.userAgent||'',ios=/iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),android=/Android/.test(ua),embedded=/FBAN|FBAV|Instagram|; wv\)|WebView/i.test(ua);
 let list;
 if(embedded)list=['Ouvrez cette adresse dans Chrome sur Android, ou dans Safari sur iPhone : https://belleetrebelle-nailstudio.fr/manager/','Revenez sur Installer, ou utilisez le menu du navigateur pour ajouter le Manager à votre écran d’accueil.'];
 else if(ios)list=['Ouvrez le Manager dans Safari.','Touchez Partager, puis Sur l’écran d’accueil (ou Ajouter à l’écran d’accueil). Activez Ouvrir comme app si cette option apparaît.','Vérifiez le nom B&R Manager puis touchez Ajouter.'];
 else if(android)list=['Dans Chrome ou Edge, ouvrez le menu ⋮ du navigateur.','Choisissez Installer l’application ou Ajouter à l’écran d’accueil, puis Installer si proposé.','Vérifiez que le nom indique Manager et que l’adresse est /manager/. Si seule la création d’un raccourci est proposée, ouvrez cette page dans Chrome et réessayez.'];
 else list=['Dans Chrome ou Edge, cherchez Installer dans le menu du navigateur ou l’icône d’installation près de l’adresse. Sur Safari Mac compatible, utilisez Fichier puis Ajouter au Dock.','Vérifiez le nom Belle & Rebelle · Manager Mélanie. Si votre navigateur ne propose pas l’installation, ouvrez le Manager dans Chrome ou Edge.'];
 message.textContent=text||'Le navigateur ne propose pas encore de fenêtre d’installation. Voici la méthode pour cet appareil.';
 steps.replaceChildren();for(const text of list){const li=document.createElement('li');li.textContent=text;steps.append(li);}
 panel.scrollIntoView({block:'nearest',behavior:'auto'});
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e;refresh();if(!panel.hidden)message.textContent='L’installation native est disponible. Touchez Installer en haut de la page.';});
window.addEventListener('appinstalled',()=>{installedHere=true;pending=null;refresh();});
if(mode.addEventListener)mode.addEventListener('change',refresh);else if(mode.addListener)mode.addListener(refresh);
close.addEventListener('click',()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus();});
button.addEventListener('click',async()=>{
 if(installed()){refresh();return;}if(busy)return;
 if(!pending){guide();return;}
 const event=pending;pending=null;busy=true;button.disabled=true;
 try{
  await event.prompt();
  const choice=await event.userChoice;
  if(choice?.outcome==='accepted'){guide('Installation acceptée. Attendez la confirmation du navigateur, puis ouvrez B&R Manager depuis vos applications.');}
  else guide('Installation non confirmée. Vous pouvez continuer dans le navigateur ou installer le Manager avec son menu.');
 }catch{guide('La fenêtre d’installation n’a pas pu s’ouvrir. Utilisez le menu du navigateur indiqué ci-dessous.');}
 finally{busy=false;button.disabled=false;refresh();}
});
refresh();
})();
