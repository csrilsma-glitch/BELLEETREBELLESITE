const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');let count=0;
function scan(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const n=path.join(p,e.name);if(e.isDirectory())scan(n);else if(n.endsWith('.js')){cp.execFileSync(process.execPath,['--check',n]);count++;}}}
scan('site');scan('netlify');console.log(count+' fichiers JavaScript valides');
const catalogue=JSON.parse(fs.readFileSync('site/assets/prestations.json'));if(catalogue.services.length!==64)throw Error('Catalogue incomplet');console.log('64 prestations conservées');
