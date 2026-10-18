const c=require('./lib/core'),o=require('./lib/outlook');
exports.handler=e=>c.wrap(e,async()=>{
 if(e.httpMethod!=='GET')return c.json(405,{error:'GET requis'});
 const q=e.queryStringParameters||{};if(q.error)c.fail(400,'Autorisation Outlook refusée');if(!q.state||!q.code)c.fail(400,'Retour OAuth incomplet');
 // DELETE RETURNING consomme state une seule fois, y compris en cas de requêtes simultanées.
 const rows=await c.db('br15_oauth?state_hash=eq.'+c.sha(q.state)+'&expires=gt.'+new Date().toISOString(),{method:'DELETE',prefer:'return=representation'});
 if(!rows.length)c.fail(403,'Autorisation expirée ou déjà utilisée');
 const t=await o.exchange({grant_type:'authorization_code',code:q.code,code_verifier:rows[0].verifier});
 await c.db('br15_outlook?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates',data:{id:true,encrypted:c.seal({...t,expires_at:Date.now()+t.expires_in*1000}),calendar_id:null,last_sync:null,error:null}});
 return {statusCode:303,headers:{Location:'/manager/#outlook-connected','Cache-Control':'no-store','Referrer-Policy':'no-referrer'},body:''};
});
