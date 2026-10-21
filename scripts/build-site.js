#!/usr/bin/env node
/* Préparation du site publié.
   - Sans BR_SITE=manager (site principal) : aucune modification, le site client est publié tel quel.
   - Avec BR_SITE=manager (second site Netlify dédié au Manager) : seuls le Manager et les assets partagés
     sont publiés, à la racine du sous-domaine ; la racine redirige vers /manager/.
   Le nettoyage ne touche que le dossier de build de Netlify, jamais le dépôt. */
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || process.cwd();
const site = path.join(root, 'site');

if (process.env.BR_SITE !== 'manager') {
  console.log('BR_SITE non défini : site client publié sans modification.');
  process.exit(0);
}
if (!fs.existsSync(path.join(site, 'manager', 'index.html'))) {
  throw new Error('site/manager/index.html introuvable : build Manager annulé.');
}
for (const name of fs.readdirSync(site)) {
  if (name === 'manager' || name === 'assets') continue;
  fs.rmSync(path.join(site, name), { recursive: true, force: true });
}
// La racine du sous-domaine renvoie vers /manager/, pour que les chemins relatifs du Manager restent valides.
fs.writeFileSync(path.join(site, '_redirects'), '/  /manager/  301\n');
console.log('Site Manager préparé : ' + fs.readdirSync(site).join(', '));
