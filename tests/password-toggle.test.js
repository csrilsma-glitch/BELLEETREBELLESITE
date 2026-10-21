const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('each password control preserves value and autofill, masks on submit, reset and background',()=>{
 const win={},docEvents={},doc={hidden:false},fields={},buttons=[];
 for(const id of ['manager-password','new-password','confirm-password']){
  const events={},forms={},attributes={};const input={type:'password',value:'synthetic-'+id,form:{addEventListener:(k,f)=>forms[k]=f}};
  fields[id]=input;buttons.push({id,events,forms,attributes,setAttribute:(k,v)=>attributes[k]=v,getAttribute:()=>id,addEventListener:(k,f)=>events[k]=f});
 }
 doc.getElementById=id=>fields[id];doc.querySelectorAll=()=>buttons;
 doc.addEventListener=(k,f)=>(docEvents[k]??=[]).push(f);
 vm.runInNewContext(fs.readFileSync('site/manager/password-toggle.js','utf8'),{document:doc,window:{addEventListener:(k,f)=>(win[k]??=[]).push(f)}});
 for(const b of buttons){b.events.click();assert.equal(fields[b.id].type,'text');assert.equal(b.attributes['aria-pressed'],'true');assert.equal(b.attributes['aria-label'],'Masquer le mot de passe');b.events.click();assert.equal(fields[b.id].type,'password');assert.equal(fields[b.id].value,'synthetic-'+b.id);
 for(const fn of [b.forms.submit,b.forms.reset]){b.events.click();fn();assert.equal(fields[b.id].type,'password');}}
 buttons.forEach(b=>b.events.click());doc.hidden=true;docEvents.visibilitychange.forEach(f=>f());for(const f of Object.values(fields))assert.equal(f.type,'password');
 const login=fs.readFileSync('site/manager/index.html','utf8'),reset=fs.readFileSync('site/manager/reset-password.html','utf8');
 assert.match(login,/name="password" type="password" autocomplete="current-password"/);
 assert.equal((reset.match(/data-password-toggle/g)||[]).length,2);
 assert.equal((reset.match(/autocomplete="new-password"/g)||[]).length,2);
 assert.match(fs.readFileSync('site/manager/reset-password.js','utf8'),/button:not\(\[type=button\]\)/);
});
