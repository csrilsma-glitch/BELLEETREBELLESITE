(async()=>{
'use strict';const $=id=>document.getElementById(id),state=window.BR_SELECTION,params=new URLSearchParams(location.search),status=$('native-status');
if(params.has('prestations'))state.set(params.get('prestations').split(','));
const fragment=new URLSearchParams(location.hash.slice(1));let moveSearch=0,bookingId=fragment.get('booking'),token=fragment.get('token'),catalogue=[],selected=state.get(),slot=null,requestKey=crypto.randomUUID(),managed,testMode=false;
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
function slots(target,list,onChoose){
 target.replaceChildren();if(!list.length){target.textContent='Aucun créneau disponible à cette date pour cette durée.';return;}
 const label=document.createElement('label'),select=document.createElement('select');select.id=target.id+'-select';label.htmlFor=select.id;label.textContent='Choisir un horaire disponible';
 const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Sélectionnez votre horaire…';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);
 for(const period of ['morning','afternoon']){const group=document.createElement('optgroup');group.label=period==='morning'?'Matin':'Après-midi';for(const [index,s] of list.entries()){const time=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date(s.starts));if((Number(time.slice(0,2))<12)!==(period==='morning'))continue;const option=document.createElement('option');option.value=String(index);option.textContent=time;group.append(option);}if(group.childElementCount)select.append(group);}
 select.onchange=()=>{if(select.value!=='')onChoose(list[Number(select.value)]);};target.append(label,select);
}
async function showManaged(){managed=await api('reservations',{action:'view',id:bookingId,token});testMode=managed.test_mode===true;$('native-create').hidden=true;$('native-manage').hidden=false;const summary=$('manage-summary');summary.replaceChildren();for(const t of [managed.status==='annule'?'Rendez-vous annulé':'Votre rendez-vous est enregistré',when(managed.starts),...managed.services.map(s=>s.path),euro(managed.cents)]){const p=document.createElement('p');p.textContent=t;summary.append(p);}
 const cancelled=managed.status==='annule',modifiable=managed.status==='confirme';
 $('manage-actions').hidden=!modifiable;$('manage-final').hidden=!cancelled;$('cancel-booking').disabled=!modifiable;$('move-find').disabled=!modifiable;$('move-date').disabled=!modifiable;$('download-ics').disabled=!modifiable;
 $('move-slots').replaceChildren();$('manage-summary').classList.toggle('manage-cancelled',cancelled);
 $('choice-banner').textContent=cancelled?'Rendez-vous annulé — le créneau est libéré.':'Retrouvez ici les détails et la gestion de votre rendez-vous.';
 $('manage-policy').hidden=!modifiable;$('manage-policy').textContent='Déplacement et annulation possibles jusqu’à 24 heures avant le rendez-vous. Ensuite, appelez Mélanie au 06 62 28 75 45.';
 if(!modifiable)$('google-calendar').removeAttribute('href');

 const fmt=x=>new Date(x).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');if(modifiable)$('google-calendar').href='https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:'Belle & Rebelle',dates:fmt(managed.starts)+'/'+fmt(managed.ends),location:'28 rue de Messei, 61100 Flers'});
 note(testMode?'Test uniquement : aucun e-mail ni SMS envoyé.':'Conservez votre lien de gestion reçu par e-mail.');}
try{
 if(bookingId&&token){await showManaged();}else{
 const d=await api('catalog');catalogue=d.services;testMode=d.test_mode===true;$('privacy-text').textContent=d.privacy_text||'';
 for(const s of catalogue){const o=document.createElement('option');o.value=s.id;o.textContent=s.path+' · '+s.minutes+' min · '+euro(s.cents);$('service-add').append(o);}
 if(!d.enabled){note('Le nouveau calendrier n’est pas encore ouvert. Appelez Mélanie au 06 62 28 75 45.');return;}
 $('native-create').hidden=false;render();note('Heures affichées dans le fuseau de Paris.');
 $('booking-date').min=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris'}).format(new Date());
 }
}catch(e){note(e.message,true);}
$('add-service').onclick=()=>{const id=$('service-add').value;if(!selected.includes(id))selected.push(id);clearSlot();render();};$('booking-date').onchange=clearSlot;
$('find-slots').onclick=async()=>{clearSlot();try{note('Recherche…');const searchKey=requestKey,d=await api('availability',{date:$('booking-date').value,service_ids:selected});if(searchKey!==requestKey)return;slots($('native-slots'),d.slots,s=>{slot=s;$('booking-submit').disabled=false;$('booking-review').textContent=`${when(s.starts)} — ${d.quote.minutes} min — ${euro(d.quote.cents)}. Paiement sur place, sans acompte.`;});note('Choisissez votre horaire.');}catch(e){note(e.message,true);}};
$('native-form').onsubmit=async e=>{e.preventDefault();if(!slot)return;$('booking-submit').disabled=true;try{const d=await api('reservations',{service_ids:selected,starts:slot.starts,client_name:$('client-name').value,client_phone:$('client-phone').value,client_email:$('client-email').value,consent:$('booking-consent').checked,confirmed:true,request_key:requestKey});bookingId=d.booking.id;token=d.token;await showManaged();note(d.notifications_disabled?'Rendez-vous fictif enregistré. Aucun e-mail ni SMS envoyé en préproduction.':'Rendez-vous enregistré. Les notifications sont en cours de traitement.');}catch(e){note(e.message,true);$('booking-submit').disabled=false;}};
$('cancel-booking').onclick=async()=>{if(managed?.status!=='confirme')return;if(!confirm('Confirmez-vous l’annulation de ce rendez-vous ?'))return;const button=$('cancel-booking');button.disabled=true;note('Annulation en cours…');try{await api('reservations',{action:'cancel',id:bookingId,token});await showManaged();const success=document.createElement('p');success.setAttribute('role','status');success.style.fontWeight='700';success.textContent='✓ Votre rendez-vous a bien été annulé. Le créneau est libéré.';$('manage-summary').prepend(success);note('Votre rendez-vous a bien été annulé.');}catch(e){button.disabled=false;note('Annulation impossible : '+e.message,true);}};
$('move-date').onchange=()=>{moveSearch++;$('move-slots').replaceChildren();};
$('move-find').onclick=async()=>{if(managed?.status!=='confirme')return;const currentSearch=++moveSearch;try{const ids=managed.services.map(s=>s.id),date=$('move-date').value,d=await api('availability',{date,service_ids:ids,booking_id:bookingId,token});if(currentSearch!==moveSearch)return;slots($('move-slots'),d.slots,async s=>{if(managed?.status!=='confirme')return;if(!confirm('Déplacer le rendez-vous au '+when(s.starts)+' ?'))return;try{await api('reservations',{action:'move',id:bookingId,token,date,service_ids:ids,starts:s.starts});$('move-slots').replaceChildren();await showManaged();}catch(e){note(e.message,true);}});}catch(e){note(e.message,true);}};
$('download-ics').onclick=async()=>{if(managed?.status!=='confirme')return;try{const r=await fetch('/.netlify/functions/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ics',id:bookingId,token})});if(!r.ok)throw Error('Invitation indisponible');const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download='Belle-et-Rebelle.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(e){note(e.message,true);}};
})();
