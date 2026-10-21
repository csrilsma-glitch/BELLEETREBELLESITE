const crypto=require('node:crypto'),c=require('./core'),o=require('./outlook');
async function deliver(j){
 const id=j.payload.block_id,revision=j.payload.revision;
 if(!c.uuid(id)||!Number.isInteger(revision))return {obsolete:true};
 // Essai réel temporaire : une seule pause explicitement autorisée, sans rattrapage des anciennes.
 if(process.env.APP_ENV==='preproduction'&&id!==process.env.OUTLOOK_PREPROD_BLOCK_ID)return {deferred:true};
 let row=(await c.db('br15_block_outlook?block_id=eq.'+id))[0];
 if(!row||row.revision!==revision||row.synced_revision>=revision)return {obsolete:true};
 // Ne pas solder une simulation : la tâche attend l'autorisation et reste relançable.
 if(process.env.APP_ENV==='preproduction'&&!await o.testWriteAllowed())return {deferred:true};
 const lease=crypto.randomUUID();
 if(!await c.rpc('block_lease',{p_id:id,p_revision:revision,p_token:lease}))throw Error('Synchronisation de période déjà en cours');
 try{
 row=(await c.db('br15_block_outlook?block_id=eq.'+id))[0];
 if(row.revision!==revision)return {obsolete:true};
 const connection=await o.connection();if(!connection?.calendar_id)c.fail(503,'Calendrier Outlook non sélectionné');
 const calendar=row.calendar_id||connection.calendar_id;
 if(row.calendar_id&&row.calendar_id!==connection.calendar_id)c.fail(409,'Calendrier modifié : vérifier les périodes synchronisées');
 const path='/me/calendars/'+encodeURIComponent(calendar)+'/events';
 let eventId=row.event_id;
 // Réconcilier un POST accepté dont la réponse ou l'écriture locale aurait été perdue.
 if(!eventId){let next=path+'?$select=id,transactionId&$top=100',seen=0;
 while(next){const page=await o.graph(next);if(!Array.isArray(page.value))throw Error('Lecture des événements Outlook incomplète');seen+=page.value.length;
 const matches=page.value.filter(x=>x.transactionId===id);if(matches.length>1||(eventId&&matches[0]&&eventId!==matches[0].id))throw Error('Doublons Outlook à vérifier');if(matches[0])eventId=matches[0].id;
 const link=page['@odata.nextLink'];if(link&&!link.startsWith('https://graph.microsoft.com/v1.0/'))throw Error('Pagination Outlook invalide');next=link?link.slice('https://graph.microsoft.com/v1.0'.length):null;if(seen>5000)throw Error('Trop d’événements Outlook : reprise requise');}
 }

 if(!row.desired){if(eventId)await o.graph(path+'/'+encodeURIComponent(eventId),{method:'DELETE'});eventId=null;}
 else{
 const d=row.desired,data={subject:(process.env.APP_ENV==='preproduction'?'[TEST V15] ':'')+'Belle & Rebelle — Indisponibilité',body:{contentType:'text',content:'Indisponibilité gérée depuis le Manager Belle & Rebelle.'},start:{dateTime:new Date(d.starts).toISOString().replace('Z',''),timeZone:'UTC'},end:{dateTime:new Date(d.ends).toISOString().replace('Z',''),timeZone:'UTC'},showAs:'busy',transactionId:id};
 let result;if(eventId){const update={...data};delete update.transactionId;result=await o.graph(path+'/'+encodeURIComponent(eventId),{method:'PATCH',data:update});}
 if(!eventId||result?.missing)result=await o.graph(path,{method:'POST',data});
 eventId=result?.id||eventId;if(!eventId)throw Error('Événement Outlook non confirmé');
 }
 // Si la pause a évolué pendant Graph, conserver son mapping mais jamais déclarer la nouvelle révision synchronisée.
 await c.db('br15_block_outlook?block_id=eq.'+id+'&lease_token=eq.'+lease,{method:'PATCH',data:{event_id:eventId,calendar_id:calendar,synced_revision:revision}});
 return {provider_id:eventId||'outlook-block-deleted'};
 }finally{await c.rpc('block_lease',{p_id:id,p_revision:revision,p_token:lease,p_release:true});}
}
module.exports={deliver};
