const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core'),n=require('../netlify/functions/lib/notifications');
test('worker traite une rafale de tâches simulées sans appeler de fournisseur',async()=>{
 const saved={rpc:c.rpc,db:c.db},env=process.env.APP_ENV;process.env.APP_ENV='preproduction';let claimed=0,patches=0;
 c.rpc=async()=>++claimed<=12?[{id:'j'+claimed,kind:'email-client',booking_id:'test',payload:{revision:1},attempts:1}]:[];
 c.db=async(path,opt)=>{if(path.startsWith('br15_bookings'))return [{revision:1,status:'confirme'}];if(path.startsWith('br15_jobs')){assert.equal(opt.data.provider_id,'preprod-simulated');patches++;}return [];};
 try{assert.equal((await n.run()).length,12);assert.equal(patches,12);}finally{Object.assign(c,saved);if(env===undefined)delete process.env.APP_ENV;else process.env.APP_ENV=env;}
});
