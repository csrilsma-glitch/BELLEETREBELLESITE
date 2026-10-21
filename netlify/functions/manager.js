const c=require('./lib/core'),b=require('./lib/booking');
// Période bloquée : dates valides, fin strictement après le début, motif obligatoire (contrôle avant toute écriture).
function blockData(x){
 if(typeof x?.starts!=='string'||typeof x?.ends!=='string')c.fail(400,'Date de début ou de fin invalide.');
 const s=new Date(c.instant(x.starts)),e=new Date(c.instant(x.ends)),label=typeof x.label==='string'?x.label.trim().slice(0,200):'';
 if(isNaN(s)||isNaN(e))c.fail(400,'Date de début ou de fin invalide.');
 if(e<=s)c.fail(400,'La date de fin doit être postérieure à la date de début.');
 if(!label)c.fail(400,'Indiquez un motif pour cette période.');
 return {starts:s.toISOString(),ends:e.toISOString(),label};
}
// Refuser les notes trop longues plutôt que confirmer une sauvegarde tronquée.
function clientData(x){if(!c.uuid(x?.id))c.fail(400,'Identifiant invalide');if(typeof x.notes!=='string')c.fail(400,'Texte des notes invalide.');if(Array.from(x.notes).length>4000)c.fail(400,'Les notes sont limitées à 4000 caractères. Raccourcissez le texte avant de réessayer.');return {id:x.id,notes:x.notes};}
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
 if(d.action==='update-block'){if(!c.uuid(d.data?.id))c.fail(400,'Identifiant invalide');const x=blockData(d.data);return c.json(200,await c.rpc('update_block',{p_id:d.data.id,p_starts:x.starts,p_ends:x.ends,p_label:x.label}));}
 if(d.action==='block')return c.json(200,await c.rpc('admin',{p_action:'block',p_data:blockData(d.data)}));
 if(d.action==='client'){
 // La fonction SQL répond « ok » même si aucune ligne n’a été modifiée : on relit la note pour confirmer l’écriture.
 const p=clientData(d.data);await c.rpc('admin',{p_action:'client',p_data:p});
 const saved=(await c.db('br15_clients?select=notes&id=eq.'+p.id))[0];
 if(!saved||saved.notes!==p.notes)c.fail(503,'Notes non enregistrées. Réessayez.');
 return c.json(200,{ok:true});
 }
 if(['settings','service','hours','unblock'].includes(d.action))return c.json(200,await c.rpc('admin',{p_action:d.action,p_data:d.data}));
 if(d.action==='erase-client'){if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');return c.json(200,await c.rpc('erase_client',{p_id:d.id}));}
 if(d.action==='export')return c.json(200,{clients:await c.db('br15_clients'),bookings:await c.db('br15_bookings?select=id,client_id,starts,ends,status,cents,minutes,services')});
 if(d.action==='retry'){if(!c.uuid(d.id))c.fail(400,'Identifiant invalide');await c.db('br15_jobs?id=eq.'+d.id+'&state=in.(failed,uncertain)',{method:'PATCH',data:{state:'pending',attempts:0,run_at:new Date().toISOString(),error:null}});return c.json(200,{ok:true});}
 c.fail(400,'Action inconnue');
});
