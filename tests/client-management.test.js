const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../netlify/functions/lib/core'),b=require('../netlify/functions/lib/booking');
const {handler}=require('../netlify/functions/reservations');
test('export agenda refusé après annulation ou clôture, vue toujours accessible',async()=>{
 const saved={owned:b.owned,rate:c.rate};c.rate=async()=>{};
 try{for(const status of ['annule','termine']){
 b.owned=async()=>({id:'test',status,services:[]});
 const call=action=>handler({httpMethod:'POST',headers:{},body:JSON.stringify({action})});
 assert.equal((await call('ics')).statusCode,409);assert.equal((await call('view')).statusCode,200);
 }}finally{b.owned=saved.owned;c.rate=saved.rate;}
});
