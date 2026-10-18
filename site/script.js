(() => {
  const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('nav');
  function closeMenu(){if(!nav||!toggle)return;nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';}
  if(toggle&&nav){
    toggle.setAttribute('aria-controls','nav');
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'✕':'☰';});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();}});
    const desktop=matchMedia('(min-width:851px)');desktop.addEventListener('change',e=>{if(e.matches)closeMenu();});
  }
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  const audio=document.getElementById('bg-music'),button=document.getElementById('music-toggle');
  if(!audio||!button)return;
  const read=k=>{try{return sessionStorage.getItem(k);}catch{return null;}};
  const write=(k,v)=>{try{sessionStorage.setItem(k,v);}catch{}};
  audio.volume=.2;audio.loop=true;audio.preload='none';
  const label=on=>{button.textContent=on?'♪ Musique : ON':'♪ Musique : OFF';button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Couper la musique de fond':'Activer la musique de fond');};
  const start=()=>{if(!navigator.onLine)return Promise.resolve();return audio.play().then(()=>label(true)).catch(()=>label(false));};
  const position=Number(read('br-music-position')||0);
  audio.addEventListener('loadedmetadata',()=>{if(Number.isFinite(position)&&position>0&&position<audio.duration)audio.currentTime=position;},{once:true});
  audio.addEventListener('play',()=>label(true));audio.addEventListener('pause',()=>label(false));audio.addEventListener('error',()=>label(false));
  button.addEventListener('click',()=>{if(audio.paused){write('br-music','on');start();}else{write('br-music','off');audio.pause();}});
  const firstGesture=e=>{if(e.target.closest('#music-toggle'))return;if(read('br-music')!=='off'&&audio.paused)start();document.removeEventListener('pointerdown',firstGesture);document.removeEventListener('keydown',firstGesture);};
  label(false);
  if(read('br-music')!=='off'){start();document.addEventListener('pointerdown',firstGesture);document.addEventListener('keydown',firstGesture);}
  window.addEventListener('pagehide',()=>write('br-music-position',String(audio.currentTime||0)));
  document.querySelectorAll('.video-showcase video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('.video-showcase video').forEach(other=>{if(other!==video)other.pause();});if(!audio.paused){audio.pause();write('br-music','off');}}));
})();
