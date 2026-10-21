const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('password visibility keeps value and autofill, never submits, resets to hidden',()=>{
 const events={},formEvents={},windowEvents={},attrs={'autocomplete':'current-password'},buttonAttrs={};
 const input={type:'password',value:'synthetic-test-value',form:{addEventListener:(k,f)=>formEvents[k]=f},getAttribute:k=>attrs[k]};
 const button={setAttribute:(k,v)=>buttonAttrs[k]=v,addEventListener:(k,f)=>events[k]=f};
 vm.runInNewContext(fs.readFileSync('site/manager/password-toggle.js','utf8'),{document:{getElementById:id=>id==='manager-password'?input:button},window:{addEventListener:(k,f)=>windowEvents[k]=f}});
 events.click();assert.equal(input.type,'text');assert.equal(buttonAttrs['aria-pressed'],'true');assert.equal(buttonAttrs['aria-label'],'Masquer le mot de passe');
 events.click();assert.equal(input.type,'password');assert.equal(input.value,'synthetic-test-value');assert.equal(input.getAttribute('autocomplete'),'current-password');
 for(const fn of [formEvents.submit,formEvents.reset,windowEvents.pagehide]){events.click();fn();assert.equal(input.type,'password');assert.equal(buttonAttrs['aria-pressed'],'false');}
 const html=fs.readFileSync('site/manager/index.html','utf8');assert.match(html,/id="password-toggle" type="button"/);assert.match(html,/aria-controls="manager-password"/);
});
