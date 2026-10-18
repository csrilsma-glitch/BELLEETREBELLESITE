const c=require('./lib/core');
exports.handler=e=>c.wrap(e,async()=>{if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});await c.manager(e);return c.json(200,{jobs:await require('./lib/notifications').run()});});
