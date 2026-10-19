(async()=>{
'use strict';const $=id=>document.getElementById(id),state=window.BR_SELECTION,params=new URLSearchParams(location.search),status=$('native-status');
if(params.has('prestations'))state.set(params.get('prestations').split(','));
const fragment=new URLSearchParams(location.hash.slice(1));let bookingId=fragment.get('booking'),token=fragment.get('token'),catalogue=[],selected=state.get(),slot=null,requestKey=crypto.randomUUID(),managed,testMode=false;
if(bookingId&&token)history.replaceState(null,'',location.pathname); // Le jeton ne quitte jamais le fragment ni la mémoire.
const euro=c=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(c/100);
const when=x=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'full',timeStyle:'short'}).format(new Date(x));
async function api(name,data){const r=await fetch('/.netlify/functions/'+name,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Service indisponible');return d;}
function note(t,error=false){status.textContent=t;status.className=error?'error':'';}
function clearSlot(){slot=null;$('booking-submit').disabled=true;$('native-slots').replaceChildren();$('booking-review').textContent='Choisissez un créneau pour relire votre rendez-vous.';requestKey=crypto.randomUUID();}
function render(){
 $('native-selection').replaceChildren();$('booking-selection').replaceChildren();selected=selected.filter(id=>catalogue.some(s=>s.id===id));state.set(selected);
 let cents=0,minutes=0;for(const id of selected){const s=catalogue.find(x=>x.id===id);cents+=s.cents;minutes+=s.minutes;const li=document.createElement('li');li.textContent=`${s.path} · ${s.minutes} min · ${euro(s.cents)} `;const remove=document.createElement('button');remove.type='button';remove.textContent='Retirer';remove.addEventListener('click',()=>{selected=selected.filter(x=>x!==id);clearSlot();render();});li.append(remove);$('native-selection').append(li);}
 $('native-total').textContent=`${selected.length} prestation(s) · ${minutes} min · ${euro(cents)}`;
 $('choice-banner').textContent='Composez votre sélection, puis choisissez un créneau. Aucun acompte.';
}
function slots(target,list,onChoose){target.replaceChildren();if(!list.length){target.textContent='Aucun créneau disponible à cette date pour cette durée.';return;}
 for(const s of list){const button=document.createElement('button');button.type='button';button.textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date(s.starts));button.setAttribute('aria-pressed','false');button.onclick=()=>{target.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));button.setAttribute('aria-pressed','true');onChoose(s);};target.append(button);}}
async function showManaged(){managed=await api('reservations',{action:'view',id:bookingId,token});testMode=managed.test_mode===true;$('native-create').hidden=true;$('native-manage').hidden=false;const summary=$('manage-summary');summary.replaceChildren();for(const t of [managed.status==='annule'?'Rendez-vous annulé':'Votre rendez-vous est enregistré',when(managed.starts),...managed.services.map(s=>s.path),euro(managed.cents)]){const p=document.createElement('p');p.textContent=t;summary.append(p);}
 $('cancel-booking').disabled=managed.status!=='confirme';$('move-find').disabled=managed.status!=='confirme';
 const fmt=x=>new Date(x).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');$('google-calendar').href='https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:'Belle & Rebelle',dates:fmt(managed.starts)+'/'+fmt(managed.ends),location:'28 rue de Messei, 61100 Flers'});
 note(testMode?'Test uniquement : aucun e-mail ni SMS envoyé.':'Conservez votre lien de gestion reçu par e-mail.');}
try{
 if(bookingId&&token){await showManaged();}else{
 const d=await api('catalog');catalogue=d.services;testMode=d.test_mode===true;$('privacy-text').textContent=d.privacy_text||'';
 for(const s of catalogue){const o=document.createElement('option');o.value=s.id;o.textContent=s.path+' · '+s.minutes+' min · '+euro(s.cents);$('service-add').append(o);}
 if(!d.enabled){note('Le nouveau calendrier n’est pas encore ouvert. Appelez Mélanie au 06 62 28 75 45.');const a=document.createElement('a');a.href='reservation-legacy.html'+location.search;a.textContent='Accéder au calendrier précédent pendant la transition';status.append(document.createElement('br'),a);return;}
 $('native-create').hidden=false;render();note('Heures affichées dans le fuseau de Paris.');
 $('booking-date').min=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris'}).format(new Date());
 }
}catch(e){note(e.message,true);}
$('add-service').onclick=()=>{const id=$('service-add').value;if(!selected.includes(id))selected.push(id);clearSlot();render();};$('booking-date').onchange=clearSlot;
$('find-slots').onclick=async()=>{clearSlot();try{note('Recherche…');const d=await api('availability',{date:$('booking-date').value,service_ids:selected});slots($('native-slots'),d.slots,s=>{slot=s;$('booking-submit').disabled=false;$('booking-review').textContent=`${when(s.starts)} — ${d.quote.minutes} min — ${euro(d.quote.cents)}. Paiement sur place, sans acompte.`;});note('Choisissez votre horaire.');}catch(e){note(e.message,true);}};
$('native-form').onsubmit=async e=>{e.preventDefault();if(!slot)return;$('booking-submit').disabled=true;try{const d=await api('reservations',{service_ids:selected,starts:slot.starts,client_name:$('client-name').value,client_phone:$('client-phone').value,client_email:$('client-email').value,consent:$('booking-consent').checked,confirmed:true,request_key:requestKey});bookingId=d.booking.id;token=d.token;await showManaged();note(d.notifications_disabled?'Rendez-vous fictif enregistré. Aucun e-mail ni SMS envoyé en préproduction.':'Rendez-vous enregistré. Les notifications sont en cours de traitement.');}catch(e){note(e.message,true);$('booking-submit').disabled=false;}};
$('cancel-booking').onclick=async()=>{if(!confirm('Confirmez-vous l’annulation de ce rendez-vous ?'))return;try{await api('reservations',{action:'cancel',id:bookingId,token});await showManaged();}catch(e){note(e.message,true);}};
$('move-find').onclick=async()=>{try{const ids=managed.services.map(s=>s.id),date=$('move-date').value,d=await api('availability',{date,service_ids:ids,booking_id:bookingId,token});slots($('move-slots'),d.slots,async s=>{if(!confirm('Déplacer le rendez-vous au '+when(s.starts)+' ?'))return;try{await api('reservations',{action:'move',id:bookingId,token,date,service_ids:ids,starts:s.starts});$('move-slots').replaceChildren();await showManaged();}catch(e){note(e.message,true);}});}catch(e){note(e.message,true);}};
$('download-ics').onclick=async()=>{try{const r=await fetch('/.netlify/functions/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ics',id:bookingId,token})});if(!r.ok)throw Error('Invitation indisponible');const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download='Belle-et-Rebelle.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(e){note(e.message,true);}};
})();
