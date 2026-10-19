// Temporary integration runner, deploy ONLY to the isolated test Supabase.
// Replace __HASH__ and __EXPIRY__ in-memory at deployment; never include a secret.
const PROJECT='https://xrpjrweqdhihloykabml.supabase.co';
const EXPECTED_HASH='__HASH__';
const EXPIRES=Number('__EXPIRY__');
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function otp(secret:string){
 const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const x of secret.toUpperCase().replace(/=+$/,''))bits+=chars.indexOf(x).toString(2).padStart(5,'0');
 const key=Uint8Array.from((bits.match(/.{8}/g)||[]).map(x=>parseInt(x,2)));
 const counter=new Uint8Array(8);new DataView(counter.buffer).setBigUint64(0,BigInt(Math.floor(Date.now()/30000)));
 const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-1'},false,['sign']);const sig=new Uint8Array(await crypto.subtle.sign('HMAC',k,counter));const o=sig[19]&15;
 const n=((sig[o]&127)<<24)|(sig[o+1]<<16)|(sig[o+2]<<8)|sig[o+3];return String(n%1000000).padStart(6,'0');
}
Deno.serve(async req=>{
 if(Deno.env.get('SUPABASE_URL')!==PROJECT||!Number.isFinite(EXPIRES)||Date.now()>EXPIRES||req.method!=='POST'||await hash(req.headers.get('x-validation-token')||'')!==EXPECTED_HASH)return new Response('Not found',{status:404});
 const admin=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
 const result:Record<string,unknown>={};let id='',userToken='',registered=false;
 async function call(path:string,method:string,data:unknown,key=admin,token=admin){const r=await fetch(PROJECT+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});const body=await r.json().catch(()=>null);if(!r.ok)throw Error('HTTP '+r.status+' '+path.split('?')[0]+' '+String(body?.code||body?.msg||body?.message||body?.error_code||'').slice(0,180));return body;}
 try{
  const email='br15-validation-'+crypto.randomUUID()+'@example.com',password=crypto.randomUUID()+'!aA4';
  const user=await call('/auth/v1/admin/users','POST',{email,password,email_confirm:true});id=user.id;if(!id)throw Error('No test user id');
  await call('/rest/v1/br15_managers','POST',{user_id:id,active:true});registered=true;result.account_created=true;
  const session=await call('/auth/v1/token?grant_type=password','POST',{email,password},anon,anon);userToken=session.access_token;result.password_login=session.user.id===id;
  const factor=await call('/auth/v1/factors','POST',{factor_type:'totp',friendly_name:'V15 fictitious integration'},anon,userToken);
  const challenge=await call('/auth/v1/factors/'+factor.id+'/challenge','POST',{},anon,userToken);
  const verified=await call('/auth/v1/factors/'+factor.id+'/verify','POST',{challenge_id:challenge.id,code:await otp(factor.totp.secret)},anon,userToken);userToken=verified.access_token;
  const claim=JSON.parse(atob(userToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));result.mfa_aal2=claim.aal==='aal2';
  const who=await call('/auth/v1/user','GET',undefined,anon,userToken);result.verified_user=who.id===id;result.totp_verified=who.factors?.some((f:any)=>f.factor_type==='totp'&&f.status==='verified')===true;
  const rows=await call('/rest/v1/br15_managers?user_id=eq.'+id+'&active=eq.true','GET',undefined);result.allowlist=rows.length===1;
  await call('/auth/v1/logout?scope=global','POST',{},anon,userToken);result.logout=true;
 }catch(e){result.error=(e as Error).message;}
 finally{
  if(id){
   if(registered)try{await call('/rest/v1/br15_managers?user_id=eq.'+id,'PATCH',{active:false});result.allowlist_disabled=true;}catch{result.cleanup_error=true;}
   try{await call('/auth/v1/admin/users/'+id,'PUT',{ban_duration:'876000h'});result.test_account_banned=true;}catch{result.cleanup_error=true;}
  }
 }
 return Response.json(result,{status:result.error||result.cleanup_error?500:200,headers:{'Cache-Control':'no-store'}});
});
