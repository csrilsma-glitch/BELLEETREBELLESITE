'use strict';
// B&R APP (cliente) dans /app/ : manifeste, périmètre, installation depuis l'accueil, Manager inchangé.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const site = path.join(__dirname, '..', 'site');
const read = p => fs.readFileSync(path.join(site, p), 'utf8');

test('B&R APP : manifeste propre, identité et périmètre dans /app/', () => {
  const m = JSON.parse(read('app/manifest.webmanifest'));
  assert.equal(m.name, 'B&R APP');
  assert.equal(m.id, '/app/');
  assert.equal(m.scope, '/app/');
  assert.equal(m.start_url, '/app/');
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
});

test('B&R APP ne couvre pas le Manager', () => {
  const m = JSON.parse(read('app/manifest.webmanifest'));
  assert.ok(!('/manager/'.startsWith(m.scope)) && !m.scope.startsWith('/manager'), 'le périmètre ne doit pas contenir /manager/');
  assert.notEqual(m.id, '/manager/');
});

test('accueil : bouton « Installer B&R APP » et manifeste /app/', () => {
  const home = read('index.html');
  assert.match(home, /<link rel="manifest" href="app\/manifest\.webmanifest">/);
  assert.match(home, /id="install-app"[^>]*>Installer B&amp;R APP</);
  assert.match(read('pwa.js'), /'Installer B&R APP'/);
});

test('réservation : même manifeste B&R APP, aucun manifeste racine', () => {
  const res = read('reservation.html');
  assert.match(res, /<link rel="manifest" href="app\/manifest\.webmanifest">/);
  assert.doesNotMatch(res, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(res, /id="install-app"[^>]*>Installer B&amp;R APP</);
});

test('pages publiques : aucun manifeste ne pointe vers la racine du site', () => {
  for (const f of ['index.html', 'reservation.html', 'conditions-reservation.html', 'mentions-legales.html', 'confidentialite.html', 'cookies.html']) {
    assert.doesNotMatch(read(f), /<link rel="manifest" href="manifest\.webmanifest">/, f);
  }
});

test('installation masquée dans la coque B&R APP (iframe ou ?source=pwa)', () => {
  const js = read('pwa.js');
  assert.match(js, /window\.self\s*!==\s*window\.top/);
  assert.match(js, /source=pwa/);
  assert.match(js, /section\.hidden\s*=\s*true/);
});

test('coque /app/ : iframe vers l’accueil public, service worker dans /app/', () => {
  const shell = read('app/index.html');
  assert.match(shell, /<iframe[^>]*src="\.\.\/\?source=pwa"/);
  assert.match(shell, /register\('sw\.js', \{ scope: '\.\/'/);
  assert.ok(fs.existsSync(path.join(site, 'app', 'sw.js')));
});

test('bouton d’installation : prompt() appelé depuis le clic, sans attendre', () => {
  const js = read('pwa.js');
  assert.match(js, /addEventListener\('beforeinstallprompt'/);
  assert.match(js, /event\.prompt\(\)/);
  assert.doesNotMatch(js, /await prompt/);
  assert.match(js, /register\('app\/sw\.js', \{ scope: 'app\/'/);
});

test('fenêtre de secours : titre B&R APP, jamais « Installer Belle & Rebelle »', () => {
  for (const f of ['index.html', 'reservation.html']) {
    const html = read(f);
    assert.match(html, /<h2 id="install-dialog-title">Installer B&amp;R APP<\/h2>/, f);
    assert.doesNotMatch(html, /Installer Belle &amp; Rebelle/, f);
  }
});

test('manifeste B&R APP : icônes 192 et 512 « any » et « maskable » séparées', () => {
  const m = JSON.parse(read('app/manifest.webmanifest'));
  assert.ok(m.icons.some(i => i.sizes === '192x192' && i.purpose === 'any'));
  assert.ok(m.icons.some(i => i.sizes === '512x512' && i.purpose === 'any'));
  assert.ok(m.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'));
});

test('coque /app/ : titre iOS « B&R APP » pour l’écran d’accueil', () => {
  assert.match(read('app/index.html'), /apple-mobile-web-app-title" content="B&amp;R APP"/);
});
