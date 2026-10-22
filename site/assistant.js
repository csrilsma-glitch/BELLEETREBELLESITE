/* Guide local de validation : aucun appel API, aucun message ni rendez-vous envoyé. */
(() => {
  const $=id=>document.getElementById(id),toggle=$('assistant-toggle'),panel=$('assistant-panel'),log=$('assistant-log'),form=$('assistant-form'),input=$('assistant-input');
  if(!toggle||!panel||!log||!form||!input)return;
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function message(role,text,action){
    const div=document.createElement('div');div.className='assistant-msg assistant-'+role;div.textContent=role==='bot'?text.replace(/\*\*([^*]+)\*\*/g,'$1'):text;
    if(action){const a=document.createElement('a');a.textContent=action.label;a.href=action.href;div.append(a);}
    log.append(div);log.scrollTop=log.scrollHeight;
  }
  function draft(subject,body){return {label:'Préparer un e-mail pour Mélanie',href:'mailto:belleetrebelle.flers@outlook.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)};}
  function answer(raw){
    const text=normalize(raw), selected=(window.BR_SELECTION?.get()||[]).map(id=>window.BR_PRESTATIONS[id]);
    const selection=selected.map(p=>p.path+' · '+window.BR_FORMAT.fmtLine(p)).join('\n');
    if(/probleme|reclam|diffic|souci|casse|casse|douleur|rembours|erreur|annul|retard|mecontente|abime|decolle/.test(text)){
      message('bot','Je peux vous aider à préparer un message à Mélanie. Rien n’est envoyé automatiquement : vous relisez puis envoyez votre e-mail vous-même. Pour une modification de rendez-vous, Mélanie vous confirmera la suite.',draft('Belle & Rebelle — demande d’aide',raw+(selection?'\n\nMa sélection :\n'+selection:'')));return;
    }
    if(/plusieurs|deux|consecut|enchai|multip|meme jour|pose et deco/.test(text)){
      message('bot','Pour enchaîner plusieurs prestations le même jour, composez votre sélection dans le crâne. Mélanie doit confirmer leur compatibilité et le créneau. Je peux préparer la demande ; aucun rendez-vous n’est confirmé ici.',draft('Belle & Rebelle — plusieurs prestations le même jour','Bonjour Mélanie,\nJe souhaiterais plusieurs prestations le même jour.\n'+(selection||'Mes prestations : à préciser')+'\n\nMes disponibilités :\n'));return;
    }
    if(/acompte|paiement|payer|arrhes/.test(text)){message('bot','La réservation est sans acompte, y compris pour une première visite. Aucun paiement n’est demandé sur ce site.');return;}
    if(/reserv|creneau|disponib|rendez|rdv/.test(text)){message('bot','Votre sélection est conservée sur la page de réservation. Vous pourrez ouvrir le calendrier natif et y vérifier les disponibilités réelles. La réservation est sans acompte. Je ne peux pas confirmer de créneau depuis ce chat.',{label:'Voir ma sélection et la réservation',href:window.BR_SELECTION?.url()||'reservation.html'});return;}
    if(/adresse|ou etes|ou se|flers|salon/.test(text)){message('bot','Mélanie vous accueille au 28 rue de Messei, 61100 Flers. Téléphone : 06 62 28 75 45.');return;}
    if(/horaire|ouvert/.test(text)){message('bot','Les disponibilités se vérifient dans le calendrier natif. Pour une question d’horaire, contactez Mélanie au 06 62 28 75 45.');return;}
    const terms=text.replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!['combien','coute','tarif','prix','pour','avec','veux','faire','prestation','ongles','bonjour'].includes(w));
    const entries=Object.values(window.BR_PRESTATIONS||{});
    const scored=entries.map(p=>({p,score:terms.reduce((n,t)=>n+(normalize(p.path).includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(scored.length){const best=scored.filter(x=>x.score===scored[0].score).slice(0,4);message('bot','Voici les prestations correspondantes dans le catalogue fourni :\n\n'+best.map(x=>x.p.path+'\n'+window.BR_FORMAT.fmtLine(x.p)).join('\n\n')+'\n\nLe tarif final se confirme dans le récapitulatif de réservation.',{label:'Explorer le sélecteur',href:'index.html#prestations'});return;}
    message('bot','Je peux vous guider dans les prestations, la réservation sans acompte et les demandes à Mélanie. Pour choisir une technique, explorez les deux familles dans le crâne. Pour une question précise, Mélanie reste joignable au 06 62 28 75 45.',{label:'Choisir une prestation',href:'index.html#prestations'});
  }
  function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open){if(!log.childElementCount)message('bot','Bonjour, je suis Melba ♡ Je vous aide à explorer le catalogue et à préparer votre réservation sans acompte. Je peux vérifier les disponibilités et vous accompagner jusqu’à la confirmation.');input.focus({preventScroll:true});}else toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>setOpen(panel.hidden));$('assistant-close').addEventListener('click',()=>setOpen(false));
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  const quick=document.createElement('div');quick.className='assistant-quick';
  // Melba répond via le serveur (netlify/functions/chat.js) quand il est disponible ;
  // sinon (version statique), on garde les réponses locales ci-dessous.
  const history=[];let bookingContext=null,contextSignature=null,requestSequence=0;
  function proposal(draft,sequence){
    const card=document.createElement('div');card.className='assistant-msg assistant-bot';
    const text=document.createElement('p');
    text.textContent=draft.quote.services.map(s=>s.path).join(' + ')+' — '+new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'full',timeStyle:'short'}).format(new Date(draft.starts))+' — '+draft.quote.minutes+' min — '+new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(draft.quote.cents/100)+' — '+draft.client_name+' · '+draft.client_phone+' · '+draft.client_email;
    const privacy=document.createElement('p');privacy.textContent='Chargement des informations clientèle…';
    const label=document.createElement('label'),consent=document.createElement('input');consent.type='checkbox';label.append(consent,document.createTextNode(' J’ai lu les informations relatives à mes données.'));
    const button=document.createElement('button');button.type='button';button.className='assistant-confirm';button.textContent='Confirmer ce rendez-vous sans acompte';button.disabled=true;
    const key=crypto.randomUUID();
    fetch('/.netlify/functions/catalog',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(c=>{if(sequence!==requestSequence)return;privacy.textContent=c.privacy_text||'Réservations non ouvertes.';button.disabled=!c.enabled||!c.privacy_text;}).catch(()=>{privacy.textContent='Informations indisponibles. Passez par la page Réservation.';});
    button.onclick=async()=>{if(sequence!==requestSequence)return;if(!consent.checked){privacy.textContent+=' Merci de cocher la case après lecture.';return;}button.disabled=true;
      try{const r=await fetch('/.netlify/functions/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,request_key:key,consent:true,confirmed:true})});const d=await r.json();if(!r.ok)throw Error(d.error||'Réservation refusée');button.remove();consent.disabled=true;message('bot',d.notifications_disabled?'Rendez-vous fictif enregistré. Aucun e-mail ni SMS envoyé en préproduction.':'Votre rendez-vous est enregistré. Les notifications sont en cours de traitement.',{label:'Gérer mon rendez-vous',href:d.manage_url});history.push({role:'user',content:'Le bouton de confirmation a créé le rendez-vous '+d.booking.id+'.'});
      }catch(e){message('bot',e.message);button.disabled=false;}
    };
    card.append(text,privacy,label,button);log.append(card);log.scrollTop=log.scrollHeight;
  }
  async function ask(text){
    const sequence=++requestSequence;
    // Une proposition ancienne ne reste pas actionnable après un nouveau message.
    log.querySelectorAll('.assistant-confirm').forEach(b=>{b.disabled=true;b.textContent='Proposition remplacée — demandez un nouveau créneau';});
    const userMessage={role:'user',content:text};history.push(userMessage);
    try{
      const res=await fetch('/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-20),bookingContext,contextSignature,selected_service_ids:window.BR_SELECTION?.get()||[]})});
      if(!res.ok)throw new Error('indisponible');
      const data=await res.json();
      if(sequence!==requestSequence)return;
      if(!data.reply)throw new Error('vide');
      bookingContext=data.bookingContext||null;contextSignature=data.contextSignature||null;
      history.push({role:'assistant',content:data.reply,signature:data.signature});
      message('bot',data.reply);
      if(data.pendingBooking) proposal(data.pendingBooking,sequence);

    }catch(err){if(sequence!==requestSequence)return;const index=history.indexOf(userMessage);if(index>=0)history.splice(index,1);message('bot','Je ne peux pas joindre mon service pour le moment. Aucun rendez-vous ni message n’a été envoyé par cette tentative. Réessayez ou appelez Mélanie au 06 62 28 75 45.');}
  }
  ['Sans acompte ?','Plusieurs prestations','Un problème'].forEach(label=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{message('user',label);ask(label);});quick.append(b);});
  panel.insertBefore(quick,form);
  form.addEventListener('submit',e=>{e.preventDefault();const raw=input.value.trim();if(!raw)return;input.value='';message('user',raw);ask(raw);});
})();
