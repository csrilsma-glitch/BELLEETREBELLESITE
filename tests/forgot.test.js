'use strict';
// « Mot de passe oublié ? » (netlify/functions/manager-forgot.js). Supabase Auth est simulé : aucun e-mail réel.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.BOOKING_SIGNING_KEY = 'test-signing-key-fictif';
const c = require('../netlify/functions/lib/core');
const forgot = require('../netlify/functions/manager-forgot');
const recovery = require('../netlify/functions/manager-recovery');

function stub({ allowed = true, authError = null } = {}) {
  const calls = [];
  c.rate = async () => {};
  c.rpc = async () => allowed;
  c.authRequest = async (path, opts = {}) => {
    calls.push({ path, opts });
    if (authError) throw Object.assign(new Error('x'), { status: authError });
    return {};
  };
  return calls;
}
function env(extra = {}) {
  const saved = { ...process.env };
  for (const k of ['APP_ENV', 'SITE_URL']) delete process.env[k];
  Object.assign(process.env, extra);
  return () => { process.env = saved; };
}
const req = email => ({ httpMethod: 'POST', body: JSON.stringify({ action: 'request', email }) });
const savedFns = { rate: c.rate, rpc: c.rpc, authRequest: c.authRequest, db: c.db };
test.afterEach(() => { Object.assign(c, savedFns); });

test('adresse normalisée et validée', () => {
  assert.equal(forgot._test.normalize('  Melanie@Exemple.FR '), 'melanie@exemple.fr');
  assert.equal(forgot._test.valid('melanie@exemple.fr'), true);
  assert.equal(forgot._test.valid('pas une adresse'), false);
});

test('production : lien demandé à Supabase avec retour vers la page de réinitialisation', async () => {
  const restore = env({ SITE_URL: 'https://exemple.test' });
  const calls = stub();
  try {
    const r = await forgot.handler(req('  Melanie@Exemple.FR '));
    assert.equal(r.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, 'recover?redirect_to=' + encodeURIComponent('https://exemple.test/manager/reset-password.html'));
    assert.deepEqual(calls[0].opts.data, { email: 'melanie@exemple.fr' });
  } finally { restore(); }
});

test('réponse identique que le compte existe ou non (pas d’énumération)', async () => {
  const restore = env();
  try {
    stub();
    const exists = await forgot.handler(req('a@exemple.test'));
    stub({ authError: 400 });
    const unknown = await forgot.handler(req('inconnu@exemple.test'));
    assert.equal(exists.statusCode, 200);
    assert.equal(unknown.statusCode, 200);
    assert.equal(exists.body, unknown.body);
    assert.match(JSON.parse(exists.body).message, /Si un accès Manager existe/);
  } finally { restore(); }
});

test('préproduction : aucun appel à Supabase, réponse identique', async () => {
  const restore = env({ APP_ENV: 'preproduction' });
  const calls = stub();
  try {
    const r = await forgot.handler(req('melanie@exemple.fr'));
    assert.equal(r.statusCode, 200);
    assert.equal(calls.length, 0);
  } finally { restore(); }
});

test('limite par adresse atteinte : aucun envoi, réponse identique', async () => {
  const restore = env();
  const calls = stub({ allowed: false });
  try {
    const r = await forgot.handler(req('melanie@exemple.fr'));
    assert.equal(r.statusCode, 200);
    assert.equal(calls.length, 0);
  } finally { restore(); }
});

test('entrées invalides refusées avant tout appel', async () => {
  const restore = env();
  const calls = stub();
  try {
    assert.equal((await forgot.handler(req('pas une adresse'))).statusCode, 400);
    assert.equal((await forgot.handler({ httpMethod: 'POST', body: '{"action":"autre"}' })).statusCode, 400);
    assert.equal((await forgot.handler({ httpMethod: 'GET' })).statusCode, 405);
    assert.equal(calls.length, 0);
  } finally { restore(); }
});

test('double authentification : mauvais code TOTP = 403, pas 401 (évite le faux « lien expiré »)', async () => {
  const restore = env();
  const user = { id: '09bc28e7-8f02-4cb1-a8ac-29b04cd47185', factors: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] };
  const token = 'h.' + Buffer.from(JSON.stringify({ aal: 'aal1' })).toString('base64url') + '.s';
  const sealed = c.seal({ token, user_id: user.id, expires: Date.now() + 600000 });
  c.rate = async () => {};
  c.db = async () => [{ user_id: user.id }];
  c.authRequest = async (path) => {
    if (path === 'user') return user;
    if (path.endsWith('/challenge')) return { id: 'ch1' };
    throw Object.assign(new Error('x'), { status: 400 });
  };
  try {
    const r = await recovery.handler({ httpMethod: 'POST', headers: { cookie: 'br15_recovery=' + encodeURIComponent(sealed) }, body: JSON.stringify({ action: 'verify', code: '000000' }) });
    assert.equal(r.statusCode, 403);
    assert.match(JSON.parse(r.body).error, /incorrect ou expiré/);
  } finally { restore(); }
});

const PREPROD = 'https://belleetrebelle-v15-preproduction.netlify.app';
test('préproduction : test réel seulement pour l’adresse autorisée, avec le drapeau explicite', async () => {
  const restore = env({ APP_ENV: 'preproduction', SITE_URL: PREPROD, PREPROD_RECOVERY_TEST: 'true', PREPROD_RECOVERY_ALLOWLIST: 'Manager.Test@Exemple.FR' });
  const calls = stub();
  try {
    await forgot.handler(req('autre@exemple.test'));
    assert.equal(calls.length, 0, 'adresse non autorisée : aucun appel');
    await forgot.handler(req('manager.test@exemple.fr'));
    assert.equal(calls.length, 1, 'adresse autorisée : un appel');
    assert.equal(calls[0].path, 'recover?redirect_to=' + encodeURIComponent(PREPROD + '/manager/reset-password.html'));
  } finally { restore(); }
});
test('préproduction : drapeau absent ou faux = aucun appel même pour l’adresse listée', async () => {
  const restore = env({ APP_ENV: 'preproduction', SITE_URL: PREPROD, PREPROD_RECOVERY_TEST: 'false', PREPROD_RECOVERY_ALLOWLIST: 'manager.test@exemple.fr' });
  const calls = stub();
  try {
    const r = await forgot.handler(req('manager.test@exemple.fr'));
    assert.equal(r.statusCode, 200);
    assert.equal(calls.length, 0);
  } finally { restore(); }
});
test('préproduction : SITE_URL absent ou production = aucun appel, jamais le domaine public', async () => {
  const restore = env({ APP_ENV: 'preproduction', PREPROD_RECOVERY_TEST: 'true', PREPROD_RECOVERY_ALLOWLIST: 'manager.test@exemple.fr', SITE_URL: 'https://belleetrebelle-nailstudio.fr' });
  const calls = stub();
  try {
    // Réponse identique (pas d’oracle) ; aucun e-mail ; l’erreur de configuration est journalisée.
    const r = await forgot.handler(req('manager.test@exemple.fr'));
    assert.equal(r.statusCode, 200);
    assert.equal(JSON.parse(r.body).message, forgot._test.GENERIC);
    assert.equal(calls.length, 0);
  } finally { restore(); }
});
test('production : lien sur le domaine public, inchangé', async () => {
  const restore = env({});
  try { assert.equal(forgot._test.resetUrl(), 'https://belleetrebelle-nailstudio.fr/manager/reset-password.html'); }
  finally { restore(); }
});
