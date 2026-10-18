const c=require('./lib/core'),b=require('./lib/booking');
exports.handler=e=>c.wrap(e,async()=>{if(e.httpMethod!=='GET')return c.json(405,{error:'GET requis'});const s=await b.settings();const services=await c.db('br15_services?active=eq.true&order=position.asc');return c.json(200,{services,enabled:s.enabled,privacy_text:s.privacy_text,cancel_hours:s.cancel_hours,timezone:s.timezone});});
