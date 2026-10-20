const c=require('./core');
async function settings(){const s=(await c.db('br15_settings?id=eq.true'))[0];if(!s)c.fail(503,'Base native non initialisée');return {...s,enabled:s.enabled&&process.env.NATIVE_BOOKING_ENABLED==='true'};}
async function outlookGuard(){const s=await settings();if(s.outlook_required){const o=(await c.db('br15_outlook?id=eq.true&select=calendar_id,last_sync,error'))[0];if(!o?.calendar_id||o.error||!o.last_sync||Date.now()-Date.parse(o.last_sync)>10*60000)c.fail(503,'Agenda Outlook à reconnecter ou synchroniser avant réservation');}}
async function availability(date,ids,exclude=null){if(!(await settings()).enabled)return [];await outlookGuard();return c.rpc('slots',{p_date:c.date(date),p_ids:c.ids(ids),p_exclude:exclude});}
async function book(input){
 if(input.confirmed!==true||input.consent!==true)c.fail(400,'Confirmation explicite et information clientèle requises');
 if(!c.uuid(input.request_key))c.fail(400,'Clé de réservation invalide');
 if(!(await settings()).enabled)c.fail(503,'Réservations natives non ouvertes');
 await outlookGuard();
 const token=c.tokenFor(input.request_key);
 const b=await c.rpc('book',{p_ids:c.ids(input.service_ids),p_start:c.instant(input.starts),p_name:String(input.client_name||''),p_email:String(input.client_email||''),p_phone:c.phone(input.client_phone),p_key:input.request_key,p_hash:c.sha(token)});
 return {ok:true,notifications_disabled:process.env.APP_ENV==='preproduction'&&!require('./realtest').active(),booking:{id:b.id,starts:b.starts,ends:b.ends,services:b.services,cents:b.cents,minutes:b.minutes,status:b.status},token,manage_url:'/reservation.html#booking='+b.id+'&token='+token};
}
async function owned(id,token){if(!c.uuid(id)||typeof token!=='string'||token.length>100)c.fail(400,'Lien invalide');const b=(await c.db('br15_bookings?id=eq.'+id))[0];if(!b||!c.safeEqual(b.token_hash,c.sha(token))||Date.now()>Date.parse(b.token_expires))c.fail(403,'Lien invalide ou expiré');return b;}
module.exports={settings,availability,book,owned};
