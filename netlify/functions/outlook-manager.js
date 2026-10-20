const c=require('./lib/core'),o=require('./lib/outlook');
exports.handler=e=>c.wrap(e,async()=>{await c.manager(e);if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});const d=c.body(e);
 if(d.action==='calendars'){let path='/me/calendars?$top=100',list=[];while(path){const r=await o.graph(path);list.push(...r.value);const n=r['@odata.nextLink'];if(n&&!n.startsWith('https://graph.microsoft.com/v1.0/'))c.fail(503,'Lien Graph invalide');path=n?n.slice('https://graph.microsoft.com/v1.0'.length):null;}return c.json(200,{calendars:list.map(x=>({id:x.id,name:x.name,isDefaultCalendar:x.isDefaultCalendar,canEdit:x.canEdit}))});}
 if(d.action==='select'){const r=await o.graph('/me/calendars/'+encodeURIComponent(d.calendar_id));if(r.missing||!r.canEdit)c.fail(400,'Choisissez un calendrier modifiable');await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{calendar_id:r.id,last_sync:null}});return c.json(200,await o.pull());}
 if(d.action==='sync')return c.json(200,await o.pull());
 if(d.action==='disconnect'){await c.db('br15_outlook?id=eq.true',{method:'DELETE'});await c.rpc('outlook_blocks',{p_blocks:[]});return c.json(200,{ok:true});}
 c.fail(400,'Action inconnue');});
