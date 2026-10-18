const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#nav');toggle.addEventListener('click',()=>{const opened=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(opened));toggle.textContent=opened?'✕':'☰'});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}));document.querySelector('#year').textContent=new Date().getFullYear();

/* Musique de fond : démarre seule si le navigateur l'autorise, sinon au premier clic de la visiteuse. */
(function(){
  const btn=document.getElementById('music-toggle'), audio=document.getElementById('bg-music');
  if(!btn||!audio) return;
  audio.volume=0.35; audio.loop=true; audio.preload='auto';
  const setLabel=on=>{btn.textContent=on?'♪ Musique : ON':'♪ Musique : OFF';btn.setAttribute('aria-pressed',String(on));};
  const start=()=>audio.play().then(()=>setLabel(true)).catch(()=>setLabel(false));
  let armed=false;
  const armFirstClick=()=>{ if(armed) return; armed=true;
    const go=()=>{ if(audio.paused) start(); document.removeEventListener('pointerdown',go); document.removeEventListener('keydown',go); };
    document.addEventListener('pointerdown',go); document.addEventListener('keydown',go); };
  start().then(()=>{}); // tentative automatique
  setTimeout(()=>{ if(audio.paused) armFirstClick(); }, 300);
  btn.addEventListener('click',()=>{ if(audio.paused){ start(); } else { audio.pause(); setLabel(false); } });
})();
