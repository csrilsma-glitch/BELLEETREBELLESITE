const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function app(ua='',standalone=false){
 const events={},nodes={};let mode={matches:standalone,addEventListener(){}};
 for(const id of ['install','install-help','install-message','install-steps','install-close'])nodes[id]={hidden:id==='install-help',attrs:{},handlers:{},textContent:'',disabled:false,items:[],setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.handlers[k]=f;},replaceChildren(){this.items=[];},append(v){this.items.push(v);},scrollIntoView(){},focus(){}};
 vm.runInNewContext(fs.readFileSync('site/manager/install.js','utf8'),{document:{getElementById:id=>nodes[id],createElement:()=>({textContent:''})},navigator:{userAgent:ua,standalone:false,maxTouchPoints:0},window:{matchMedia:()=>mode,addEventListener:(k,f)=>events[k]=f}});
 return {nodes,events,click:()=>nodes.install.handlers.click()};
}
test('install absent native event opens persistent Android instructions, close restores focus state',async()=>{
 const a=app('Android Chrome');await a.click();assert.equal(a.nodes['install-help'].hidden,false);assert.match(a.nodes['install-steps'].items.map(x=>x.textContent).join(' '),/⋮/);assert.equal(a.nodes.install.attrs['aria-expanded'],'true');a.nodes['install-close'].handlers.click();assert.equal(a.nodes['install-help'].hidden,true);
});
test('iPhone and desktop receive appropriate instructions',async()=>{
 for(const [ua,text] of [['iPhone Safari',/Safari/],['Chrome Windows',/Chrome ou Edge/],['Instagram Android',/Ouvrez cette adresse/]]){const a=app(ua);await a.click();assert.match(a.nodes['install-steps'].items.map(x=>x.textContent).join(' '),text);}
});
test('native prompt deferred until click, once only, accepted is not falsely marked installed',async()=>{
 const a=app('Chrome'),event={preventDefault(){this.prevented=true;},prompt:async()=>{event.calls=(event.calls||0)+1;},userChoice:Promise.resolve({outcome:'accepted'})};
 a.events.beforeinstallprompt(event);assert.equal(event.prevented,true);assert.equal(event.calls,undefined);await a.click();assert.equal(event.calls,1);assert.equal(a.nodes.install.hidden,false);await a.click();assert.equal(event.calls,1);a.events.appinstalled();assert.equal(a.nodes.install.hidden,true);
});
test('native prompt rejection and dismissal restore usable help instead of dead button',async()=>{
 for(const broken of [false,true]){const a=app();a.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{if(broken)throw Error('blocked');},userChoice:Promise.resolve({outcome:'dismissed'})});await a.click();assert.equal(a.nodes.install.disabled,false);assert.equal(a.nodes['install-help'].hidden,false);assert.match(a.nodes['install-message'].textContent,broken?/pas pu/:/non confirmée/);}
});
test('installed standalone Manager hides install; app identities and worker scopes remain separate',()=>{
 const a=app('',true);assert.equal(a.nodes.install.hidden,true);
 const m=JSON.parse(fs.readFileSync('site/manager/manifest.webmanifest','utf8')),c=JSON.parse(fs.readFileSync('site/manifest.webmanifest','utf8'));assert.equal(m.id,'/manager/');assert.notEqual(m.id,c.id);assert.equal(m.start_url,'/manager/');assert.equal(m.scope,'/manager/');
 assert.match(fs.readFileSync('site/sw.js','utf8'),/url.pathname.startsWith\('\/manager\/'\)/);
});
