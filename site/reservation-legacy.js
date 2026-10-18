(() => {
  const catalogue=window.BR_PRESTATIONS,format=window.BR_FORMAT,state=window.BR_SELECTION;
  const params=new URLSearchParams(location.search);
  const raw=params.get('prestations')||params.get('prestation');
  if(raw!==null)state.set(raw.split(','));
  const ids=state.get(), list=document.getElementById('booking-selection'), banner=document.getElementById('choice-banner');
  if(ids.length){
    banner.textContent='Votre sélection est prête. Vérifiez les prestations, puis choisissez votre créneau dans SimplyBook. Réservation sans acompte.';
    for(const id of ids){const p=catalogue[id],li=document.createElement('li'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=p.path;meta.textContent=format.fmtLine(p)+' · Catalogue fourni';li.append(name,meta);list.append(li);}
  }else{banner.textContent=raw?'Cette sélection n’est pas reconnue. Choisissez une prestation dans le crâne ou directement dans SimplyBook.':'Vous pouvez choisir votre prestation dans le crâne ou directement dans le calendrier SimplyBook.';}
  const multiple=document.getElementById('multiple-note');multiple.hidden=ids.length<2;
  const open=document.getElementById('open-calendar'),widget=document.getElementById('simplybook-widget');
  open.addEventListener('click',()=>{
    if(!navigator.onLine){document.getElementById('calendar-status').textContent='Une connexion Internet est nécessaire pour afficher les disponibilités réelles.';return;}
    if(widget.childElementCount){widget.scrollIntoView({behavior:'auto',block:'start'});return;}
    const iframe=document.createElement('iframe');iframe.src='https://belleetrebellenailstudio.simplybook.it/v2/';iframe.title='Calendrier officiel de réservation Belle & Rebelle sur SimplyBook';iframe.loading='eager';iframe.referrerPolicy='strict-origin-when-cross-origin';
    widget.append(iframe);open.setAttribute('aria-expanded','true');document.getElementById('calendar-status').textContent='Calendrier réel SimplyBook. Si l’affichage est bloqué, utilisez le lien « Ouvrir dans un nouvel onglet » ci-dessous.';
  });
})();
