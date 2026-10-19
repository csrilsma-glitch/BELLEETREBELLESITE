const c=require('./core');
const ROOT='https://graph.microsoft.com/v1.0';
async function connection(){if(process.env.APP_ENV==='preproduction')c.fail(503,'Outlook désactivé en préproduction');return (await c.db('br15_outlook?id=eq.true'))[0];}
async function exchange(data){if(process.env.APP_ENV==='preproduction')c.fail(503,'Outlook désactivé en préproduction');const r=await c.request('https://login.microsoftonline.com/consumers/oauth2/v2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.env('MICROSOFT_CLIENT_ID'),client_secret:c.env('MICROSOFT_CLIENT_SECRET'),redirect_uri:c.env('MICROSOFT_REDIRECT_URI'),...data}).toString()});const v=await r.json();if(!r.ok)c.fail(503,'Autorisation Outlook à renouveler');return v;}
async function graph(path,{method='GET',data}={}){
 let o=await connection();if(!o)c.fail(503,'Outlook non autorisé');let t=c.unseal(o.encrypted);
 if(t.expires_at<Date.now()+90000){
 // Rotation sérialisée via une courte location SQL.
 if(!await c.rpc('limit',{p_key:'outlook-refresh',p_max:1,p_seconds:20}))c.fail(503,'Actualisation Outlook en cours, réessayez');
 const n=await exchange({grant_type:'refresh_token',refresh_token:t.refresh_token});
 t={...t,...n,expires_at:Date.now()+n.expires_in*1000};
 await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{encrypted:c.seal(t),refreshed_at:new Date().toISOString()}});
 }
 const r=await c.request(ROOT+path,{method,headers:{Authorization:'Bearer '+t.access_token,'Content-Type':'application/json',Prefer:'outlook.timezone="UTC"'},...(data?{body:JSON.stringify(data)}:{})});
 if(r.status===204)return null;if(r.status===404)return {missing:true};const d=await r.json().catch(()=>({}));if(!r.ok)c.fail(503,'Synchronisation Outlook indisponible');return d;
}
const calendarPath=o=>'/me/calendars/'+encodeURIComponent(o.calendar_id);
async function push(b){
 const o=await connection();if(!o?.calendar_id)c.fail(503,'Calendrier Outlook non sélectionné');
 const mapping=(await c.db('br15_outlook_events?booking_id=eq.'+b.id))[0];
 const path=calendarPath(o)+'/events';
 if(b.status==='annule'){
 if(mapping){await graph(path+'/'+encodeURIComponent(mapping.event_id),{method:'DELETE'});await c.db('br15_outlook_events?booking_id=eq.'+b.id,{method:'DELETE'});}return 'annule';}
 const data={subject:'Belle & Rebelle — Rendez-vous',body:{contentType:'text',content:b.services.map(s=>s.path).join('\n')},start:{dateTime:new Date(b.starts).toISOString().replace('Z',''),timeZone:'UTC'},end:{dateTime:new Date(b.ends).toISOString().replace('Z',''),timeZone:'UTC'},showAs:'busy',transactionId:b.id};
 let r;if(mapping)r=await graph(path+'/'+encodeURIComponent(mapping.event_id),{method:'PATCH',data});
 if(!mapping||r?.missing)r=await graph(path,{method:'POST',data});
 if(r?.id)await c.db('br15_outlook_events?on_conflict=booking_id',{method:'POST',prefer:'resolution=merge-duplicates',data:{booking_id:b.id,event_id:r.id,revision:b.revision}});
 return r?.id||mapping?.event_id;
}
async function pull(){
 const o=await connection();if(!o?.calendar_id)c.fail(409,'Sélectionnez le calendrier dédié');
 // Horizon complet : les événements manuels deviennent des indisponibilités, pas des réservations clientes.
 const s=(await c.db('br15_settings?id=eq.true'))[0],from=new Date(),to=new Date(Date.now()+(s.horizon_days+1)*86400000);
 let path=calendarPath(o)+'/calendarView?startDateTime='+encodeURIComponent(from.toISOString())+'&endDateTime='+encodeURIComponent(to.toISOString())+'&$top=100';
 const events=[];
 while(path){const r=await graph(path);if(r.missing)c.fail(503,'Calendrier Outlook introuvable');events.push(...r.value);const next=r['@odata.nextLink'];if(next&&!next.startsWith(ROOT+'/'))c.fail(503,'Lien Graph invalide');path=next?next.slice(ROOT.length):null;if(events.length>5000)c.fail(503,'Trop d’événements à synchroniser');}
 const mappings=await c.db('br15_outlook_events'),own=new Set(mappings.map(x=>x.event_id));
 const blocks=events.filter(x=>!own.has(x.id)&&!x.isCancelled&&x.showAs!=='free').map(x=>({external_id:x.id,starts:x.start.dateTime.endsWith('Z')?x.start.dateTime:x.start.dateTime+'Z',ends:x.end.dateTime.endsWith('Z')?x.end.dateTime:x.end.dateTime+'Z',source:'outlook',label:'Occupé dans Outlook'}));
 await c.rpc('outlook_blocks',{p_blocks:blocks});
 const bookings=await c.db('br15_bookings?status=eq.confirme&starts=lt.'+to.toISOString()+'&ends=gt.'+from.toISOString()+'&select=starts,ends');
 const conflicts=blocks.filter(x=>bookings.some(b=>Date.parse(b.starts)<Date.parse(x.ends)&&Date.parse(b.ends)>Date.parse(x.starts))).length;
 await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{last_sync:new Date().toISOString(),error:conflicts?'Conflit Outlook : '+conflicts+' période(s) à vérifier dans le Manager':null}});
 return {ok:true,imported:blocks.length,conflicts};
}
module.exports={connection,exchange,graph,calendarPath,push,pull};
