const c=require('./lib/core'),b=require('./lib/booking');
exports.handler=e=>c.wrap(e,async()=>{if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});await c.rate(e,'booking',10);const d=c.body(e);
 if(d.action==='view'||d.action==='ics'){const r=await b.owned(d.id,d.token);if(d.action==='ics')return {statusCode:200,headers:{'Content-Type':'text/calendar; charset=utf-8','Cache-Control':'no-store'},body:c.ics(r)};return c.json(200,{test_mode:process.env.APP_ENV==='preproduction',id:r.id,starts:r.starts,ends:r.ends,status:r.status,services:r.services,cents:r.cents});}
 if(d.action==='cancel'||d.action==='move'){await b.owned(d.id,d.token);if(d.action==='move')await b.availability(c.date(d.date),d.service_ids,d.id);const r=await c.rpc('change',{p_id:d.id,p_hash:c.sha(d.token),p_action:d.action,p_start:d.action==='move'?c.instant(d.starts):null});return c.json(200,{ok:true,id:r.id,status:r.status,starts:r.starts});}
 return c.json(201,await b.book(d));});
