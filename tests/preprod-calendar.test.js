const {test}=require('node:test'),assert=require('node:assert/strict'),{NAME,ensure}=require('../netlify/functions/lib/preprod-calendar');
function fixture({selected='real',calendars=[],linked=false}={}){
 let row={calendar_id:selected},writes=[];const old=process.env.APP_ENV;process.env.APP_ENV='preproduction';
 const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
 const c={fail,rpc:async()=>true,db:async(p,opt)=>{if(opt){writes.push(['db',opt.data]);Object.assign(row,opt.data);return [];}return linked?[{event_id:'existing'}]:[];}};
 const o={connection:async()=>row,graph:async(p,opt)=>{if(opt){writes.push(['graph',p]);return {id:'created-test',name:NAME,canEdit:true,isDefaultCalendar:false};}if(p.startsWith('/me/calendars?'))return {value:calendars};return {id:selected,name:selected==='test'?NAME:'Calendar',canEdit:true,isDefaultCalendar:selected==='real'};}};
 return {o,c,writes,row,restore(){if(old===undefined)delete process.env.APP_ENV;else process.env.APP_ENV=old;}};
}
test('calendrier test déjà sélectionné : aucune modification',async()=>{const h=fixture({selected:'test'});try{await ensure(h.o,h.c);assert.equal(h.writes.length,0);}finally{h.restore();}});
test('réutilise un calendrier test distinct, sans écriture des événements réels',async()=>{const h=fixture({calendars:[{id:'existing-test',name:NAME,canEdit:true,isDefaultCalendar:false}]});try{await ensure(h.o,h.c);assert.equal(h.row.calendar_id,'existing-test');assert.equal(h.writes.filter(x=>x[0]==='graph').length,0);}finally{h.restore();}});
test('crée seulement un calendrier vide nommé préproduction et confirme sa sélection',async()=>{const h=fixture();try{await ensure(h.o,h.c);assert.equal(h.row.calendar_id,'created-test');assert.deepEqual(h.writes.filter(x=>x[0]==='graph'),[['graph','/me/calendars']]);}finally{h.restore();}});
test('refuse un changement si des événements sont déjà liés',async()=>{const h=fixture({linked:true});try{await assert.rejects(ensure(h.o,h.c),e=>e.status===409);assert.equal(h.writes.length,0);}finally{h.restore();}});
test('refuse les calendriers de test ambigus',async()=>{const h=fixture({calendars:[{id:'a',name:NAME},{id:'b',name:NAME}]});try{await assert.rejects(ensure(h.o,h.c),e=>e.status===409);assert.equal(h.writes.length,0);}finally{h.restore();}});
test('en production : aucun calendrier créé, aucune sélection changée',async()=>{const h=fixture();try{process.env.APP_ENV='production';await ensure(h.o,h.c);assert.equal(h.row.calendar_id,'real');assert.equal(h.writes.length,0);}finally{h.restore();}});
