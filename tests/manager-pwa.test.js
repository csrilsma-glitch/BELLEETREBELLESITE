const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function worker(fetch){
 const events={},saved=[],deleted=[];const cache={addAll:async()=>{},put:async(...args)=>saved.push(args),match:async()=>({offline:true})};
 const context={URL,location:{origin:'https://belleetrebelle-nailstudio.fr'},self:{skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(k,f)=>events[k]=f},caches:{open:async()=>cache,keys:async()=>['br-manager-v15-7','br-manager-v15-8','other-app'],delete:async k=>deleted.push(k)},fetch};
 vm.runInNewContext(fs.readFileSync('site/manager/sw.js','utf8'),context);return {events,saved,deleted};
}
test('Manager SW never intercepts APIs, recovery tokens, POSTs or external resources',()=>{
 const w=worker(()=>{throw Error('unexpected');});let intercepted=0;
 for(const [url,method] of [['/.netlify/functions/manager','GET'],['/manager/reset-password.html#access_token=x','GET'],['/manager/?access_token=x','GET'],['/manager/','POST'],['https://other.example/manager/','GET']]){
 w.events.fetch({request:{url:new URL(url,'https://belleetrebelle-nailstudio.fr').href,method},respondWith:()=>intercepted++});
 }assert.equal(intercepted,0);
});
test('Manager SW refreshes public shell and falls back offline, deletes only its old cache',async()=>{
 let down=false;const w=worker(async()=>{if(down)throw Error('offline');return {ok:true,type:'basic',clone:()=>({publicShell:true})};});
 let response;const e={request:{url:'https://belleetrebelle-nailstudio.fr/manager/manager.js',method:'GET'},respondWith:p=>response=p};
 w.events.fetch(e);await response;assert.equal(w.saved.length,1);
 down=true;w.events.fetch(e);assert.equal((await response).offline,true);
 let activation;w.events.activate({waitUntil:p=>activation=p});await activation;assert.deepEqual(w.deleted,['br-manager-v15-7']);
});
test('Manager starts installed at private scope and recovery is not cached',()=>{
 const m=JSON.parse(fs.readFileSync('site/manager/manifest.webmanifest','utf8'));assert.equal(m.start_url,'/manager/');assert.equal(m.scope,'/manager/');assert.equal(m.display,'standalone');
 const s=fs.readFileSync('site/manager/pwa-runtime.js','utf8');assert.match(s,/updateViaCache:'none'/);assert.match(s,/visibilitychange/);assert.match(s,/location.reload/);assert.doesNotMatch(s,/localStorage|sessionStorage|indexedDB/);
});
