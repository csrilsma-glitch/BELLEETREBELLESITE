'use strict';
const crypto=require('node:crypto');
const PUBLIC='https://belleetrebelle-nailstudio.fr';
const PREPROD_SITE='https://belleetrebelle-v15-preproduction.netlify.app';
// URL publique du site : en préproduction, jamais le domaine de production.
function siteUrl(){const base=process.env.SITE_URL;if(process.env.APP_ENV==='preproduction'){if(base!==PREPROD_SITE)fail(503,'SITE_URL de préproduction incorrect');return base;}return base||PUBLIC;}
class Failure extends Error {constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new Failure(status,message);};
function env(key){return process.env[key]||fail(503,'Configuration serveur manquante : '+key);}
function headers(){return {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};}
function json(statusCode,body,extra={}){return {statusCode,headers:{...headers(),...extra},body:JSON.stringify(body)};}
function body(e){if((e.body||'').length>24000)fail(413,'Requête trop volumineuse');try{return JSON.parse(e.body||'{}');}catch{fail(400,'JSON invalide');}}
function origin(e){const o=e.headers?.origin;if(o&&o!==(process.env.SITE_URL||PUBLIC))fail(403,'Origine refusée');}
async function wrap(e,fn){try{origin(e);return await fn();}catch(err){console.error('BR15',err.status||500,err.name);return json(err.status||503,{error:err.status?err.message:'Service indisponible. Réessayez ou appelez Mélanie.'});}}
async function request(url,opt={}){return fetch(url,{...opt,signal:opt.signal||AbortSignal.timeout(15000)});}
function isolation(){
 if(process.env.APP_ENV==='preproduction'){
 const expected=env('EXPECTED_SUPABASE_PROJECT_REF');
 if(expected==='mlbfnlidlvsqghcijuhw'||env('SUPABASE_URL')!=='https://'+expected+'.supabase.co')fail(503,'Base de préproduction isolée requise');
 }
}
async function db(path,{method='GET',data,prefer}={}){
 isolation();
 const res=await request(env('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:env('SUPABASE_SECRET_KEY'),...(env('SUPABASE_SECRET_KEY').startsWith('eyJ')?{Authorization:'Bearer '+env('SUPABASE_SECRET_KEY')}:{}),'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
 const value=await res.json().catch(()=>null);
 if(!res.ok){if(res.status===400||res.status===409){const msg=value?.message||'';const safe=/Sélection|Prestations|Prestation|Durée|Coordonnées|Créneau|Réservation native|Clé déjà|Rendez-vous|Lien invalide|Délai|Action|Horaires|Un rendez-vous/.test(msg);fail(409,safe?msg:'Opération refusée');}fail(503,'Base de réservation indisponible');}return value;
}
const rpc=(name,data)=>db('rpc/br15_'+name,{method:'POST',data});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function sign(value){return crypto.createHmac('sha256',env('BOOKING_SIGNING_KEY')).update(value).digest('base64url');}
function safeEqual(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function tokenFor(requestKey){return sign('booking:'+requestKey);}
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
function ids(x){if(!Array.isArray(x)||!x.length||x.length>12||new Set(x).size!==x.length||x.some(y=>typeof y!=='string'||!/^[a-z0-9-]{1,80}$/.test(y)))fail(400,'Sélection invalide');return x;}
function date(x){if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x)||Number.isNaN(Date.parse(x+'T12:00:00Z'))||new Date(x+'T12:00:00Z').toISOString().slice(0,10)!==x)fail(400,'Date invalide');return x;}
function instant(x){if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(x)||Number.isNaN(Date.parse(x)))fail(400,'Horaire invalide');return x;}
function phone(x){const p=String(x||'').replace(/[\s.()-]/g,'').replace(/^0/,'+33');if(!/^\+33[1-9]\d{8}$/.test(p))fail(400,'Téléphone français invalide');return p;}
async function rate(e,scope,max=30){const ip=e.headers?.['x-nf-client-connection-ip']||'unknown';if(!await rpc('limit',{p_key:scope+':'+sha(ip),p_max:max,p_seconds:600}))fail(429,'Trop de demandes. Réessayez dans quelques minutes.');}
function cookies(e){return Object.fromEntries((e.headers?.cookie||'').split(';').filter(s=>s.includes('=')).map(s=>{const i=s.indexOf('=');return [s.slice(0,i).trim(),decodeURIComponent(s.slice(i+1))];}));}
const cookie=(name,value,seconds=3600)=>`${name}=${encodeURIComponent(value)}; Path=/.netlify/functions/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
// Délai ou erreur réseau côté Auth : message clair, jamais le message générique « Service indisponible ».
async function authFetch(url,opt){try{return await request(url,opt);}catch(err){console.error('BR15 auth',err.name);fail(503,'Le service de connexion répond lentement. Réessayez dans un instant.');}}
async function authRequest(path,{method='GET',data,token}={}){isolation();const r=await authFetch(env('SUPABASE_URL')+'/auth/v1/'+path,{method,headers:{apikey:env('SUPABASE_PUBLISHABLE_KEY'),...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const d=await r.json().catch(()=>({}));if(!r.ok){if(path==='user'||path.startsWith('token'))fail(401,'Authentification refusée');console.error('BR15 auth',path.split('/')[0],path.endsWith('/verify')?'verify':'',r.status,d.error_code||d.code||'');if(path.endsWith('/verify'))fail(400,'Code incorrect ou expiré. Réessayez avec le code affiché dans votre application.');fail(400,'Configuration de sécurité refusée. Réessayez ; si le problème continue, prévenez l’administrateur.');}return d;}
// Appel brut vers Auth : renvoie le statut et le code d’erreur Supabase, sans message générique.
async function authRaw(path,{method='GET',data,token}={}){isolation();const r=await authFetch(env('SUPABASE_URL')+'/auth/v1/'+path,{method,headers:{apikey:env('SUPABASE_PUBLISHABLE_KEY'),...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const d=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data:d};}
async function manager(e,{mfa=true}={}){
 const token=cookies(e).br15_session;if(!token)fail(401,'Connexion requise');
 const user=await authRequest('user',{token});
 const rows=await db('br15_managers?user_id=eq.'+encodeURIComponent(user.id)+'&active=eq.true');
 if(!rows.length)fail(403,'Accès Manager refusé');
 // L’Auth server a authentifié CE jeton avant lecture de son assurance MFA.
 let claims;try{claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());}catch{fail(401,'Session invalide');}
 if(mfa&&claims.aal!=='aal2')fail(403,'Validation à deux facteurs requise');
 return {user,token};
}
function seal(value){const key=Buffer.from(env('TOKEN_ENCRYPTION_KEY'),'base64');if(key.length!==32)fail(503,'Clé de chiffrement invalide');const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const enc=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),enc]).toString('base64');}
function unseal(value){const b=Buffer.from(value,'base64'),d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(env('TOKEN_ENCRYPTION_KEY'),'base64'),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString());}
const localTime=x=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'full',timeStyle:'short'}).format(new Date(x));
function ics(b){const fmt=x=>new Date(x).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Belle Rebelle//V15//FR','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+b.id+'@belleetrebelle-nailstudio.fr','DTSTAMP:'+fmt(b.created_at),'SEQUENCE:'+b.revision,'DTSTART:'+fmt(b.starts),'DTEND:'+fmt(b.ends),'SUMMARY:Belle & Rebelle - Rendez-vous','LOCATION:28 rue de Messei 61100 Flers','STATUS:'+(b.status==='annule'?'CANCELLED':'CONFIRMED'),'END:VEVENT','END:VCALENDAR',''].join('\r\n');}
module.exports={PUBLIC,PREPROD_SITE,siteUrl,Failure,fail,env,json,body,origin,wrap,request,db,rpc,sha,sign,safeEqual,tokenFor,uuid,ids,date,instant,phone,rate,cookies,cookie,authRequest,authRaw,manager,seal,unseal,localTime,ics};
