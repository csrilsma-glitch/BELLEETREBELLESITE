const c=require('./lib/core');
// Erreur journalisée sans secret : statut, type d'erreur et message court (les messages internes sont fixes).
function logFailure(stage,err){console.error('BR15 jobs',stage,err?.status||500,err?.name||'Error',String(err?.message||'').slice(0,160));}
// Aucun corps HTTP ni en-tête client ne constitue une preuve de planification.
exports.handler=async()=>c.json(403,{error:'Invocation HTTP interdite'});
exports.run=async()=>{
 const o=require('./lib/outlook');
 // Synchronisation Outlook entrante : production, ou préproduction avec écriture Outlook explicitement autorisée.
 try{
  if(await o.syncAllowed()){
   try{await o.pull();}
   catch(err){logFailure('pull',err);await c.db('br15_outlook?id=eq.true',{method:'PATCH',data:{error:'Synchronisation indisponible : reconnecter ou réessayer'}}).catch(()=>{});}
  }
 }catch(err){logFailure('outlook-check',err);}
 try{
  const result=await require('./lib/notifications').run();
  return c.json(200,{ok:true,simulated:process.env.APP_ENV==='preproduction',traites:result.length});
 }catch(err){
  logFailure('run',err);
  return c.json(503,{error:'Traitement différé indisponible'});
 }
};
