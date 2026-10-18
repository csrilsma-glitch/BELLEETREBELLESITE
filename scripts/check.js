'use strict';
// Vérification de syntaxe de tous les fichiers JavaScript du dépôt (sans réseau).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const roots = ['netlify/functions', 'site', 'tests', 'scripts'];
const files = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(c|m)?js$/.test(f)) files.push(p);
  }
})(path.resolve(__dirname, '..'));
let bad = 0;
for (const r of roots) {
  for (const f of files.filter(x => x.includes(path.sep + r + path.sep))) {
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
    catch (e) { bad++; console.error('ERREUR ' + f + '\n' + e.stderr); }
  }
}
console.log(`${files.length} fichiers vérifiés, ${bad} erreur(s).`);
process.exit(bad ? 1 : 0);
