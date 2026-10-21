'use strict';
// Second site Netlify dédié au Manager : origines, lien de réinitialisation et préparation du build.
// Aucune connexion réseau, aucune donnée réelle, aucun fichier du dépôt modifié.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.BOOKING_SIGNING_KEY = 'test-signing-key-fictif';
const c = require('../netlify/functions/lib/core');
const forgot = require('../netlify/functions/manager-forgot');

const MANAGER = 'https://manager.belleetrebelle-nailstudio.fr';
const withEnv = (vars, fn) => {
  const saved = {};
  for (const k of Object.keys(vars)) { saved[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
  try { return fn(); } finally { for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
};
const req = origin => ({ headers: origin ? { origin } : {} });

test('origine : le sous-domaine Manager est accepté seulement si MANAGER_SITE_URL est défini', () => {
  withEnv({ MANAGER_SITE_URL: MANAGER, SITE_URL: undefined }, () => {
    assert.doesNotThrow(() => c.origin(req(MANAGER)));
    assert.doesNotThrow(() => c.origin(req('https://belleetrebelle-nailstudio.fr')));
    assert.throws(() => c.origin(req('https://evil.example')), /Origine refusée/);
    assert.throws(() => c.origin(req('https://manager.belleetrebelle-nailstudio.fr.evil.example')), /Origine refusée/);
  });
  withEnv({ MANAGER_SITE_URL: undefined, SITE_URL: undefined }, () => {
    assert.throws(() => c.origin(req(MANAGER)), /Origine refusée/);
    assert.doesNotThrow(() => c.origin(req('https://belleetrebelle-nailstudio.fr')));
  });
});

test('lien de réinitialisation : sous-domaine Manager sur le second site, adresse actuelle ailleurs', () => {
  withEnv({ MANAGER_SITE_URL: MANAGER, SITE_URL: undefined }, () => {
    assert.equal(forgot._test.resetUrl(), MANAGER + '/manager/reset-password.html');
  });
  withEnv({ MANAGER_SITE_URL: undefined, SITE_URL: undefined }, () => {
    assert.equal(forgot._test.resetUrl(), 'https://belleetrebelle-nailstudio.fr/manager/reset-password.html');
  });
});

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, e.name), to = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(from, to); else fs.copyFileSync(from, to);
  }
}
const repo = path.join(__dirname, '..');
function prepare(br) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'br-build-'));
  copyTree(path.join(repo, 'site'), path.join(dir, 'site'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(repo, 'scripts', 'build-site.js'), path.join(dir, 'scripts', 'build-site.js'));
  const env = { ...process.env };
  if (br === undefined) delete env.BR_SITE; else env.BR_SITE = br;
  execFileSync('node', [path.join(dir, 'scripts', 'build-site.js'), dir], { env, stdio: 'pipe' });
  return dir;
}

test('build Manager : publie seulement le Manager et les assets, avec redirection de la racine', () => {
  const dir = prepare('manager');
  const site = fs.readdirSync(path.join(dir, 'site')).sort();
  assert.deepEqual(site, ['_redirects', 'assets', 'manager']);
  assert.ok(fs.existsSync(path.join(dir, 'site', 'manager', 'index.html')));
  assert.ok(fs.existsSync(path.join(dir, 'site', 'manager', 'manager.js')));
  assert.equal(fs.readFileSync(path.join(dir, 'site', '_redirects'), 'utf8').trim(), '/  /manager/  301');
  assert.ok(fs.existsSync(path.join(dir, 'site', 'assets', 'icon-192.png')));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('build client : sans BR_SITE, le site principal reste intact', () => {
  const dir = prepare(undefined);
  assert.ok(fs.existsSync(path.join(dir, 'site', 'index.html')));
  assert.ok(fs.existsSync(path.join(dir, 'site', 'manager', 'index.html')));
  assert.ok(!fs.existsSync(path.join(dir, 'site', '_redirects')));
  fs.rmSync(dir, { recursive: true, force: true });
});
