const c=require('./lib/core');
exports.handler=e=>c.wrap(e,async()=>{
 if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});const d=c.body(e);
 await c.rate(e,'manager-auth',30);
 if(d.action==='logout')return c.json(200,{ok:true},{'Set-Cookie':c.cookie('br15_session','',0)});
 if(d.action==='login'){
 await c.rate(e,'login',10);
 const a=await c.authRequest('token?grant_type=password',{method:'POST',data:{email:d.email,password:d.password}});
 const rows=await c.db('br15_managers?user_id=eq.'+a.user.id+'&active=eq.true');if(!rows.length)c.fail(403,'Accès refusé');
 return c.json(200,{ok:true,mfa_required:true},{'Set-Cookie':c.cookie('br15_session',a.access_token,a.expires_in||3600)});
 }
 const {user,token}=await c.manager(e,{mfa:false});
 if(d.action==='factors')return c.json(200,{factors:(user.factors||[]).map(f=>({id:f.id,status:f.status,factor_type:f.factor_type}))});
 if(d.action==='enroll'){const r=await c.authRequest('factors',{method:'POST',token,data:{factor_type:'totp',friendly_name:'Manager Belle Rebelle'}});return c.json(200,{id:r.id,totp:r.totp});}
 if(d.action==='verify'){
 if(!c.uuid(d.factor_id)||!/^\d{6}$/.test(d.code||''))c.fail(400,'Code invalide');
 const ch=await c.authRequest('factors/'+d.factor_id+'/challenge',{method:'POST',token,data:{}});
 const v=await c.authRequest('factors/'+d.factor_id+'/verify',{method:'POST',token,data:{challenge_id:ch.id,code:d.code}});
 return c.json(200,{ok:true},{'Set-Cookie':c.cookie('br15_session',v.access_token,v.expires_in||3600)});
 }
 c.fail(400,'Action invalide');
});
