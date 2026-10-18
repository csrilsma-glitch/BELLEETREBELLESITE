(() => {
  let deferred=null;
  const button=document.getElementById('install-app'),status=document.getElementById('install-status'),dialog=document.getElementById('install-dialog');
  const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function refresh(){if(!button)return;button.textContent=installed()?'Application déjà installée':'Installer l’application';}
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;refresh();});
  window.addEventListener('appinstalled',()=>{deferred=null;if(status)status.textContent='Belle & Rebelle est installée sur votre appareil ♡';refresh();});
  if('serviceWorker' in navigator&&window.isSecureContext){
    window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{if(status)status.textContent='L’installation n’est pas disponible dans ce navigateur. Ouvrez ce lien dans Safari, Chrome ou Edge.';});});
  }
  if(!button||!dialog)return;
  button.addEventListener('click',async()=>{
    if(installed()){status.textContent='Retrouvez Belle & Rebelle depuis l’icône de votre écran d’accueil.';return;}
    if(deferred){const prompt=deferred;deferred=null;await prompt.prompt();const choice=await prompt.userChoice;status.textContent=choice.outcome==='accepted'?'Installation demandée. Retrouvez Belle & Rebelle sur votre appareil.':'Vous pourrez installer l’application plus tard.';return;}
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    document.getElementById('install-instructions').textContent=ios?'Sur iPhone ou iPad, ouvrez ce site dans Safari. Touchez Partager, puis « Sur l’écran d’accueil » et « Ajouter ». Si vous êtes dans ChatGPT, commencez par ouvrir le lien dans Safari.':'Sur Android, ouvrez ce site dans Chrome puis le menu ⋮ > « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur ordinateur, ouvrez-le dans Chrome ou Edge et cherchez l’icône d’installation dans la barre d’adresse. Si vous êtes dans ChatGPT, ouvrez d’abord ce lien dans votre navigateur.';
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  });
  document.getElementById('install-close').addEventListener('click',()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');button.focus();});
  refresh();
})();
