(() => {
  'use strict';
  let player=document.getElementById('realisation-player');if(!player)return;
  const template=player.cloneNode(false),count=12,counter=document.getElementById('video-counter');
  const prev=document.getElementById('video-prev'),next=document.getElementById('video-next');
  const navigation=next.parentElement,notice=document.createElement('p'),toggle=document.createElement('button');
  notice.id='video-status';notice.setAttribute('role','status');
  toggle.id='video-play';toggle.type='button';toggle.className='sk-btn';toggle.textContent='Lire';
  navigation.after(notice);navigation.append(toggle);let index=0;
  function release(video){
    video.pause();video.removeAttribute('src');
    video.querySelectorAll('source').forEach(source=>source.remove());video.load();
  }
  async function play(video){
    if(video.ended)video.currentTime=0;
    try{await video.play();if(video!==player)video.pause();}
    catch(error){if(video===player&&error.name!=='AbortError')notice.textContent='Touchez Lire pour démarrer la vidéo.';}
  }
  function show(number,resume=false){
    index=(number+count)%count;
    const previous=player,video=template.cloneNode(false);player=video;
    video.src='assets/videos/realisation-'+String(index+1).padStart(2,'0')+'.mp4';
    video.setAttribute('aria-label','Réalisation de Mélanie, vidéo '+(index+1)+' sur '+count);
    counter.textContent='Réalisation '+(index+1)+' / '+count;
    notice.textContent='Chargement de la vidéo…';toggle.textContent='Lire';toggle.disabled=false;
    const current=fn=>()=>{if(video===player)fn();};
    video.addEventListener('loadeddata',current(()=>{notice.textContent='';}));
    video.addEventListener('play',current(()=>{toggle.textContent='Pause';notice.textContent='';}));
    video.addEventListener('pause',current(()=>{toggle.textContent=video.ended?'Rejouer':'Lire';}));
    video.addEventListener('ended',current(()=>{toggle.textContent='Rejouer';notice.textContent='Vidéo terminée. Vous pouvez la rejouer ou choisir une autre réalisation.';}));
    video.addEventListener('error',current(()=>{toggle.textContent='Réessayer';notice.textContent='Cette vidéo n’a pas pu être chargée. Réessayez ou choisissez une autre réalisation.';}));
    release(previous);previous.replaceWith(video);video.load();
    if(resume)play(video);
  }
  const change=direction=>{const resume=!player.paused&&!player.ended;show(index+direction,resume);};
  prev.addEventListener('click',()=>change(-1));next.addEventListener('click',()=>change(1));
  toggle.addEventListener('click',()=>{if(player.error){show(index,true);return;}if(player.paused||player.ended)play(player);else player.pause();});
  window.addEventListener('pagehide',()=>player.pause());
  show(0);
})();
