const c=require('./lib/core');
exports.handler=async e=>{
 if(process.env.APP_ENV==='preproduction')return c.json(200,{ok:true,external_actions_disabled:true});
 // Netlify Scheduled Functions vérifie l’invocation planifiée ; ne jamais exposer un cron par URL publique.
 let p;try{p=JSON.parse(e.body||'{}');}catch{return c.json(403,{error:'Invocation planifiée requise'});}
 if(!p.next_run)return c.json(403,{error:'Invocation planifiée requise'});
 try{const o=require('./lib/outlook');if((await o.connection())?.calendar_id){try{await o.pull();}catch(err){await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{error:'Synchronisation indisponible : reconnecter ou réessayer'}});}}await require('./lib/notifications').run();return c.json(200,{ok:true});}catch{return c.json(503,{error:'Traitement différé indisponible'});}
};
