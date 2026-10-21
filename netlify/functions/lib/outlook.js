const c=require('./core');
const ROOT='https://graph.microsoft.com/v1.0';
async function connection(){if(process.env.APP_ENV==='preproduction'&&!preprodConnectAllowed())c.fail(503,'Outlook désactivé en préproduction');return (await c.db('br15_outlook?id=eq.true'))[0];}
// Préproduction : accès Microsoft autorisé uniquement par drapeau explicite et compte Outlook désigné.
// Ne jamais activer ces variables sur le site public sans validation.
const testFlag=()=>process.env.OUTLOOK_PREPROD_TEST==='true';
const testAccount=()=>String(process.env.OUTLOOK_PREPROD_TEST_ACCOUNT||'').trim().toLowerCase();
function preprodConnectAllowed(){return testFlag()&&testAccount().includes('@');}
// Préproduction : écriture et synchronisation Outlook seulement si le drapeau explicite est présent et si
// l'identité réelle du jeton OAuth (Graph /me, lecture seule) correspond au compte désigné. Résultat mis en cache 10 min.
let identityAt=0,identityOk=false;
async function testWriteAllowed(){
 if(process.env.APP_ENV!=='preproduction')return true;
 if(!preprodConnectAllowed())return false;
 if(Date.now()-identityAt<600000)return identityOk;
 let ok=false;
 try{
  const me=await graph('/me?$select=mail,userPrincipalName,otherMails');
  const ids=[me?.mail,me?.userPrincipalName,...(Array.isArray(me?.otherMails)?me.otherMails:[])].filter(Boolean).map(x=>String(x).trim().toLowerCase());
  ok=ids.includes(testAccount());
  if(!ok)console.error('BR15 outlook identity : compte différent du compte désigné');
 }catch(err){console.error('BR15 outlook identity',err?.status||500,err?.name||'Error');ok=false;}
 identityAt=Date.now();identityOk=ok;return ok;
}
async function syncAllowed(){if(!await testWriteAllowed())return false;await require('./preprod-calendar').ensure(module.exports,c);return true;}
async function assertTestAccount(t){
 const expected=testAccount();if(!expected||!t?.access_token)c.fail(403,'Compte Microsoft non autorisé pour le test préproduction');
 // Les comptes Outlook personnels peuvent présenter un alias différent dans preferred_username.
 // Vérifier l’identité réelle auprès de Microsoft Graph, sans enregistrer le jeton avant contrôle.
 const response=await c.request(ROOT+'/me?$select=mail,userPrincipalName,otherMails',{headers:{Authorization:'Bearer '+t.access_token}});
 if(!response.ok)c.fail(503,'Vérification du compte Microsoft impossible');
 const me=await response.json();const identities=[me.mail,me.userPrincipalName,...(Array.isArray(me.otherMails)?me.otherMails:[])].filter(Boolean).map(x=>String(x).trim().toLowerCase());
 if(!identities.includes(expected))c.fail(403,'Le compte Microsoft connecté ne correspond pas à celui autorisé pour le test');return true;
}
function idClaims(t){if(!t||typeof t.id_token!=='string')return null;try{return JSON.parse(Buffer.from(t.id_token.split('.')[1],'base64url').toString());}catch{return null;}}
async function exchange(data,{connectFlow=false}={}){if(process.env.APP_ENV==='preproduction'&&!preprodConnectAllowed())c.fail(503,'Outlook désactivé en préproduction');const r=await c.request('https://login.microsoftonline.com/consumers/oauth2/v2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.env('MICROSOFT_CLIENT_ID'),client_secret:c.env('MICROSOFT_CLIENT_SECRET'),redirect_uri:c.env('MICROSOFT_REDIRECT_URI'),...data}).toString()});const v=await r.json();if(!r.ok)c.fail(503,'Autorisation Outlook à renouveler');return v;}
async function graph(path,{method='GET',data}={}){
 if(process.env.APP_ENV==='preproduction'&&method!=='GET'&&path!=='/me/calendars'){
  const match=path.match(/^\/me\/calendars\/([^/]+)\/events(?:\/[^/?]+)?$/),selected=await connection();
  if(!match||decodeURIComponent(match[1])!==selected?.calendar_id)c.fail(403,'Écriture hors calendrier de test refusée');
  const cal=await graph('/me/calendars/'+encodeURIComponent(selected.calendar_id));
  if(cal.name!==require('./preprod-calendar').NAME||!cal.canEdit||cal.isDefaultCalendar)c.fail(403,'Calendrier de préproduction isolé requis');
 }

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
 if(!(await syncAllowed()))c.fail(503,'Écriture Outlook non autorisée');
 const o=await connection();if(!o?.calendar_id)c.fail(503,'Calendrier Outlook non sélectionné');
 const mapping=(await c.db('br15_outlook_events?booking_id=eq.'+b.id))[0];
 const path=calendarPath(o)+'/events';
 if(b.status==='annule'){
 if(mapping){await graph(path+'/'+encodeURIComponent(mapping.event_id),{method:'DELETE'});await c.db('br15_outlook_events?booking_id=eq.'+b.id,{method:'DELETE'});}return 'annule';}
 const data={subject:(process.env.APP_ENV==='preproduction'?'[TEST V15] ':'')+'Belle & Rebelle — Rendez-vous',body:{contentType:'text',content:b.services.map(s=>s.path).join('\n')},start:{dateTime:new Date(b.starts).toISOString().replace('Z',''),timeZone:'UTC'},end:{dateTime:new Date(b.ends).toISOString().replace('Z',''),timeZone:'UTC'},showAs:'busy',transactionId:b.id};
 let r;if(mapping)r=await graph(path+'/'+encodeURIComponent(mapping.event_id),{method:'PATCH',data});
 if(!mapping||r?.missing)r=await graph(path,{method:'POST',data});
 if(r?.id)await c.db('br15_outlook_events?on_conflict=booking_id',{method:'POST',prefer:'resolution=merge-duplicates',data:{booking_id:b.id,event_id:r.id,revision:b.revision}});
 return r?.id||mapping?.event_id;
}
async function pull(){
 if(process.env.APP_ENV==='preproduction'&&!await syncAllowed())c.fail(503,'Synchronisation de test non autorisée');
 const o=await connection();if(!o?.calendar_id)c.fail(409,'Sélectionnez le calendrier dédié');
 // Horizon complet : les événements manuels deviennent des indisponibilités, pas des réservations clientes.
 const s=(await c.db('br15_settings?id=eq.true'))[0],from=new Date(),to=new Date(Date.now()+(s.horizon_days+1)*86400000);
 let path=calendarPath(o)+'/calendarView?startDateTime='+encodeURIComponent(from.toISOString())+'&endDateTime='+encodeURIComponent(to.toISOString())+'&$top=100';
 const events=[];
 while(path){const r=await graph(path);if(r.missing)c.fail(503,'Calendrier Outlook introuvable');events.push(...r.value);const next=r['@odata.nextLink'];if(next&&!next.startsWith(ROOT+'/'))c.fail(503,'Lien Graph invalide');path=next?next.slice(ROOT.length):null;if(events.length>5000)c.fail(503,'Trop d’événements à synchroniser');}
 const mappings=await c.db('br15_outlook_events'),blockMappings=await c.db('br15_block_outlook'),own=new Set([...mappings,...blockMappings].map(x=>x.event_id).filter(Boolean)),ownTransactions=new Set(blockMappings.map(x=>x.block_id));
 const blocks=events.filter(x=>!own.has(x.id)&&!ownTransactions.has(x.transactionId)&&!x.isCancelled&&x.showAs!=='free').map(x=>({external_id:x.id,starts:x.start.dateTime.endsWith('Z')?x.start.dateTime:x.start.dateTime+'Z',ends:x.end.dateTime.endsWith('Z')?x.end.dateTime:x.end.dateTime+'Z',source:'outlook',label:'Occupé dans Outlook'}));
 await c.rpc('outlook_blocks',{p_blocks:blocks});
 const bookings=await c.db('br15_bookings?status=eq.confirme&starts=lt.'+to.toISOString()+'&ends=gt.'+from.toISOString()+'&select=starts,ends');
 const conflicts=blocks.filter(x=>bookings.some(b=>Date.parse(b.starts)<Date.parse(x.ends)&&Date.parse(b.ends)>Date.parse(x.starts))).length;
 await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{last_sync:new Date().toISOString(),error:conflicts?'Conflit Outlook : '+conflicts+' période(s) à vérifier dans le Manager':null}});
 return {ok:true,imported:blocks.length,conflicts};
}
module.exports={connection,exchange,graph,calendarPath,push,pull,preprodConnectAllowed,assertTestAccount,idClaims,testFlag,testWriteAllowed,syncAllowed};
