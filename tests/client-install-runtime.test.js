'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function runtime(embedded=false){
 const events={},handlers={},nodes={};
 for(const id of ['install-app','install-status','install-dialog','install-instructions','install-close'])nodes[id]={hidden:false,textContent:'',addEventListener:(k,f)=>handlers[id+':'+k]=f,showModal(){this.open=true;},close(){this.open=false;},focus(){},setAttribute(){},removeAttribute(){}};
 const section={hidden:false},win={self:1,top:embedded?2:1,addEventListener:(k,f)=>events[k]=f};
 vm.runInNewContext(fs.readFileSync('site/pwa.js','utf8'),{window:win,location:{search:''},navigator:{userAgent:'Android',platform:'',maxTouchPoints:0},matchMedia:()=>({matches:false}),document:{getElementById:id=>nodes[id],querySelector:()=>section},setTimeout:()=>1,clearTimeout(){}});
 return {events,handlers,nodes,section};
}
test('PWA embarquée : un événement tardif ne déclenche pas d’erreur ni de prompt',()=>{
 const r=runtime(true);let calls=0;
 assert.doesNotThrow(()=>r.events.beforeinstallprompt({preventDefault(){},prompt(){calls++;}}));
 assert.equal(calls,0);assert.equal(r.section.hidden,true);
});
test('installation tardive : attend un nouveau geste ; prompt exécuté une seule fois au clic',()=>{
 const r=runtime();let calls=0;
 r.handlers['install-app:click']();
 r.events.beforeinstallprompt({preventDefault(){},prompt(){calls++;},userChoice:Promise.resolve({outcome:'dismissed'})});
 assert.equal(calls,0,'pas de prompt hors geste utilisateur');
 r.handlers['install-app:click']();assert.equal(calls,1);
});
test('cache B&R APP : rafraîchit le manifeste, isole Manager/API et conserve le secours hors ligne',async()=>{
 const events={},saved=[];let offline=false,response;
 const cache={match:async()=>({offline:true}),put:async(...a)=>saved.push(a),addAll:async()=>{}};
 const self={location:{href:'https://belleetrebelle-nailstudio.fr/app/sw.js',origin:'https://belleetrebelle-nailstudio.fr'},addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(fs.readFileSync('site/app/sw.js','utf8'),{URL,self,caches:{open:async()=>cache},fetch:async()=>{if(offline)throw Error();return {ok:true,type:'basic',clone:()=>({fresh:true})};}});
 const call=path=>events.fetch({request:{url:'https://belleetrebelle-nailstudio.fr'+path,method:'GET'},respondWith:p=>response=p});
 call('/app/manifest.webmanifest');await response;assert.equal(saved.length,1);
 offline=true;call('/app/manifest.webmanifest');assert.equal((await response).offline,true);
 response=null;call('/manager/');assert.equal(response,null);call('/.netlify/functions/catalog');assert.equal(response,null);
});
