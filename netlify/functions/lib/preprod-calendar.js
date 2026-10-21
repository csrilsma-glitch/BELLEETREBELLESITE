// Le calendrier de test est distinct du calendrier professionnel d'exploitation.
const NAME='Belle & Rebelle — Préproduction V15';
async function ensure(o,c){
 if(process.env.APP_ENV!=='preproduction')return;
 let row=await o.connection();if(!row)c.fail(503,'Outlook non autorisé');
 if(row.calendar_id){const cal=await o.graph('/me/calendars/'+encodeURIComponent(row.calendar_id));if(cal.name===NAME&&cal.canEdit&&!cal.isDefaultCalendar)return;}
 // Ne jamais déplacer implicitement des événements déjà liés à un autre calendrier.
 const [bookings,blocks]=await Promise.all([c.db('br15_outlook_events?select=event_id'),c.db('br15_block_outlook?event_id=not.is.null&select=event_id')]);
 if(bookings.length||blocks.length)c.fail(409,'Événements déjà liés : vérifier avant de changer le calendrier de test');
 if(!await c.rpc('limit',{p_key:'outlook-preprod-calendar-setup',p_max:1,p_seconds:30}))c.fail(503,'Initialisation du calendrier de test en cours');
 let next='/me/calendars?$top=100',matches=[],count=0;
 while(next){const page=await o.graph(next);if(!Array.isArray(page.value))c.fail(503,'Liste des calendriers incomplète');matches.push(...page.value.filter(x=>x.name===NAME));count+=page.value.length;
 const link=page['@odata.nextLink'];if(link&&!link.startsWith('https://graph.microsoft.com/v1.0/'))c.fail(503,'Pagination calendrier invalide');next=link?link.slice('https://graph.microsoft.com/v1.0'.length):null;if(count>1000)c.fail(503,'Trop de calendriers');}
 if(matches.length>1)c.fail(409,'Plusieurs calendriers de test portent le même nom');
 const cal=matches[0]||await o.graph('/me/calendars',{method:'POST',data:{name:NAME}});
 if(!cal?.id||cal.name!==NAME||!cal.canEdit||cal.isDefaultCalendar)c.fail(503,'Calendrier de test non confirmé');
 await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{calendar_id:cal.id,last_sync:null,error:null}});
 const saved=await o.connection();if(saved?.calendar_id!==cal.id)c.fail(503,'Sélection du calendrier de test non enregistrée');
}
module.exports={NAME,ensure};
