const c=require('./lib/core'),b=require('./lib/booking');
exports.handler=e=>c.wrap(e,async()=>{
 await c.manager(e);if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});const d=c.body(e);
 if(d.action==='dashboard'){
 const date=c.date(d.date||new Date().toISOString().slice(0,10));
 const anchor=new Date(date+'T00:00:00Z'),from=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth(),-6)),to=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+1,8));
 const [bookings,clients,services,hours,blocks,settings,jobs,outlook]=await Promise.all([
 c.db('br15_bookings?select=id,client_id,starts,ends,status,cents,minutes,services,revision&starts=gte.'+from.toISOString()+'&starts=lt.'+to.toISOString()+'&order=starts.asc'),
 c.db('br15_clients?order=created_at.desc&limit=1000'),c.db('br15_services?order=position.asc'),c.db('br15_hours?order=dow.asc,opens.asc'),c.db('br15_blocks?order=starts.asc'),b.settings(),c.db('br15_jobs?select=id,booking_id,kind,state,attempts,error,run_at&order=run_at.desc&limit=100'),c.db('br15_outlook?select=calendar_id,last_sync,error')]);
 return c.json(200,{bookings,clients,services,hours,blocks,settings,jobs,outlook:outlook[0]||null});
 }
 if(d.action==='availability'){if(d.id&&!c.uuid(d.id))c.fail(400,'Identifiant invalide');return c.json(200,{slots:await b.availability(d.date,d.service_ids,d.id||null)});}
 if(d.action==='history'){
 if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');
 return c.json(200,{bookings:await c.db('br15_bookings?select=id,starts,ends,status,cents,minutes,services&client_id=eq.'+d.id+'&order=starts.desc')});
 }
 if(d.action==='create')return c.json(201,await b.book({...d,confirmed:true,consent:true}));
 if(['cancel','move','complete'].includes(d.action)){if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');if(d.action==='move')await b.availability(c.date(d.date),d.service_ids,d.id);const r=await c.rpc('change',{p_id:d.id,p_hash:'',p_action:d.action,p_start:d.action==='move'?c.instant(d.starts):null,p_manager:true});return c.json(200,{ok:true,id:r.id});}
 if(['settings','service','hours','block','unblock','client'].includes(d.action))return c.json(200,await c.rpc('admin',{p_action:d.action,p_data:d.data}));
 if(d.action==='erase-client'){if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');return c.json(200,await c.rpc('erase_client',{p_id:d.id}));}
 if(d.action==='export')return c.json(200,{clients:await c.db('br15_clients'),bookings:await c.db('br15_bookings?select=id,client_id,starts,ends,status,cents,minutes,services')});
 if(d.action==='retry'){if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');await c.db('br15_jobs?id=eq.'+d.id+'&state=in.(failed,uncertain)',{method:'PATCH',data:{state:'pending',attempts:0,run_at:new Date().toISOString(),error:null}});return c.json(200,{ok:true});}
 c.fail(400,'Action inconnue');
});
