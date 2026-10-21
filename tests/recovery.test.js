'use strict';
// Récupération du mot de passe Manager (netlify/functions/manager-recovery.js).
// Supabase Auth et la base sont simulés ; aucun e-mail, aucun vrai compte.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.BOOKING_SIGNING_KEY = 'test-signing-key-fictif';
const c = require('../netlify/functions/lib/core');
const handler = require('../netlify/functions/manager-recovery').handler;

const USER_ID = '09bc28e7-8f02-4cb1-a8ac-29b04cd47185'; // identifiant fictif de test
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = aal => `h.${b64({ aal })}.s`;
const origin = { origin: c.PUBLIC };

function setup({ user = { id: USER_ID, factors: [] }, allowedRows = [{ user_id: USER_ID }], authFail = null } = {}) {
  const calls = [];
  c.rate = async () => {};
  c.db = async () => allowedRows;
  c.authRequest = async (path, opts = {}) => {
    calls.push({ path, opts });
    if (authFail && path === authFail.path && (opts.method || 'GET') === (authFail.method || 'GET')) throw Object.assign(new Error('x'), { status: authFail.status });
    if (path === 'user' && (!opts.method || opts.method === 'GET')) return user;
    if (path === 'user' && opts.method === 'PUT') return {};
    if (path.startsWith('logout')) return {};
    if (path.endsWith('/challenge')) return { id: 'challenge-fictif' };
    if (path.endsWith('/verify')) return { access_token: jwt('aal2') };
    return {};
  };
  return calls;
}
const post = (body, cookie) => ({ httpMethod: 'POST', headers: { ...origin, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
const cookieFrom = r => {
  const raw = Array.isArray(r.multiValueHeaders?.['Set-Cookie']) ? r.multiValueHeaders['Set-Cookie'][0] : (r.headers?.['Set-Cookie'] || '');
  return raw.split(';')[0];
};

test('start : jeton d’un manager autorisé → cookie de récupération', async () => {
  setup();
  const r = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  assert.equal(r.statusCode, 200);
  assert.match(cookieFrom(r), /^br15_recovery=/);
  const body = JSON.parse(r.body);
  assert.equal(body.ok, true);
  assert.ok(!JSON.stringify(body).includes('h.'), 'aucun jeton dans la réponse');
});

test('start : compte absent de l’allowlist refusé', async () => {
  setup({ allowedRows: [] });
  const r = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  assert.equal(r.statusCode, 403);
});

test('start : jeton trop long ou absent refusé avant tout appel', async () => {
  const calls = setup();
  assert.equal((await handler(post({ action: 'start', access_token: 'x'.repeat(8001) }))).statusCode, 400);
  assert.equal((await handler(post({ action: 'start' }))).statusCode, 400);
  assert.equal(calls.length, 0);
});

test('start : TOTP vérifié et session aal1 → mfa_required', async () => {
  setup({ user: { id: USER_ID, factors: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] } });
  const r = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  assert.equal(JSON.parse(r.body).mfa_required, true);
});

test('reset sans cookie de récupération refusé', async () => {
  setup();
  const r = await handler(post({ action: 'reset', password: 'mot-de-passe-long-fictif' }));
  assert.equal(r.statusCode, 401);
});

test('reset : mot de passe trop court refusé, pas de mise à jour', async () => {
  const calls = setup();
  const start = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  const r = await handler(post({ action: 'reset', password: 'court' }, cookieFrom(start)));
  assert.equal(r.statusCode, 400);
  assert.ok(!calls.some(x => x.opts.method === 'PUT'));
});

test('reset : TOTP existant sans session aal2 → code de sécurité exigé', async () => {
  const calls = setup({ user: { id: USER_ID, factors: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] } });
  const start = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  const r = await handler(post({ action: 'reset', password: 'mot-de-passe-long-fictif' }, cookieFrom(start)));
  assert.equal(r.statusCode, 403);
  assert.ok(!calls.some(x => x.opts.method === 'PUT'));
});

test('verify : code non numérique refusé ; code valide → session aal2', async () => {
  setup({ user: { id: USER_ID, factors: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] } });
  const start = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  assert.equal((await handler(post({ action: 'verify', code: 'abc' }, cookieFrom(start)))).statusCode, 400);
  const ok = await handler(post({ action: 'verify', code: '123456' }, cookieFrom(start)));
  assert.equal(ok.statusCode, 200);
});

test('reset : succès → mot de passe changé avec le jeton utilisateur, déconnexion globale, cookies effacés', async () => {
  const calls = setup();
  const start = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  const r = await handler(post({ action: 'reset', password: 'mot-de-passe-long-fictif' }, cookieFrom(start)));
  assert.equal(r.statusCode, 200);
  const put = calls.find(x => x.opts.method === 'PUT');
  assert.equal(put.opts.data.password, 'mot-de-passe-long-fictif');
  assert.ok(calls.some(x => x.path === 'logout?scope=global'));
  const cookies = r.multiValueHeaders['Set-Cookie'].join(' ');
  assert.match(cookies, /br15_recovery=;/);
  assert.match(cookies, /br15_session=;/);
});

test('reset : mot de passe refusé par Auth → message sans détail technique', async () => {
  setup({ authFail: { path: 'user', method: 'PUT', status: 401 } });
  const start = await handler(post({ action: 'start', access_token: jwt('aal1') }));
  const r = await handler(post({ action: 'reset', password: 'mot-de-passe-long-fictif' }, cookieFrom(start)));
  assert.equal(r.statusCode, 400);
  assert.match(JSON.parse(r.body).error, /refusé/);
});
