(() => {
  const player=document.getElementById('realisation-player');if(!player)return;
  const count=12,status=document.getElementById('video-counter'),prev=document.getElementById('video-prev'),next=document.getElementById('video-next');let index=0;
  function show(n){
    index=(n+count)%count;player.pause();
    player.src='assets/videos/realisation-'+String(index+1).padStart(2,'0')+'.mp4';player.load();
    player.setAttribute('aria-label','Réalisation de Mélanie, vidéo '+(index+1)+' sur '+count);
    status.textContent='Réalisation '+(index+1)+' / '+count;
    // Pas de lecture automatique : la visiteuse garde le contrôle du son.
  }
  prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));
  show(0);
})();
