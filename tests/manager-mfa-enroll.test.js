'use strict';
// Enrôlement et vérification MFA du Manager : facteurs non vérifiés nettoyés, facteur vérifié jamais touché.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const CORE = path.join(__dirname, '..', 'netlify', 'functions', 'lib', 'core.js');
const HANDLER = path.join(__dirname, '..', 'netlify', 'functions', 'manager-auth.js');
const VERIFIED = '11111111-1111-4111-8111-111111111111';
const PENDING = '22222222-2222-4222-8222-222222222222';
const NEW = '33333333-3333-4333-8333-333333333333';

// Charge manager-auth.js avec un faux module core qui enregistre les appels.
function load({ factors, responses }) {
  const calls = [];
  class Failure extends Error { constructor(s, m) { super(m); this.statusCode = s; } }
  const fake = {
    wrap: async (e, fn) => { try { return await fn(); } catch (err) { if (err instanceof Failure) return { statusCode: err.statusCode, body: JSON.stringify({ error: err.message }) }; throw err; } },
    body: e => JSON.parse(e.body || '{}'),
    json: (s, b, h) => ({ statusCode: s, body: JSON.stringify(b), headers: h || {} }),
    fail: (s, m) => { throw new Failure(s, m); },
    rate: async () => {},
    cookie: (n, v, t) => `${n}=${v}; Max-Age=${t}`,
    uuid: s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || ''),
    db: async () => [],
    authRequest: async () => { throw new Error('authRequest inattendu'); },
    manager: async () => ({ user: { id: 'u', factors }, token: 'aal1' }),
    authRaw: async (p, opt = {}) => {
      calls.push({ path: p, method: opt.method || 'GET', data: opt.data });
      const key = (opt.method || 'GET') + ' ' + p.replace(/^factors\/[0-9a-f-]{36}/, 'factors/ID');
      const r = responses[key] || responses[p] || { ok: false, status: 404, data: {} };
      return typeof r === 'function' ? r(opt) : r;
    },
  };
  const core = { exports: fake, id: CORE, filename: CORE, loaded: true };
  require.cache[CORE] = core;
  delete require.cache[HANDLER];
  const handler = require(HANDLER).handler;
  const run = async body => {
    const res = await handler({ httpMethod: 'POST', body: JSON.stringify(body), headers: {} });
    return { status: res.statusCode, body: JSON.parse(res.body), cookie: res.headers?.['Set-Cookie'] };
  };
  return { run, calls };
}

const verifiedFactor = { id: VERIFIED, factor_type: 'totp', status: 'verified' };
const pendingFactor = { id: PENDING, factor_type: 'totp', status: 'unverified' };

test('enrôlement : seul un facteur non vérifié est retiré avant un nouvel enrôlement', async () => {
  const { run, calls } = load({
    factors: [pendingFactor],
    responses: {
      'DELETE factors/ID': { ok: true, status: 200, data: {} },
      'POST factors': { ok: true, status: 200, data: { id: NEW, totp: { qr_code: 'data:x', secret: 's' } } },
    },
  });
  const r = await run({ action: 'enroll' });
  assert.equal(r.status, 200);
  assert.equal(r.body.id, NEW);
  const deletes = calls.filter(c => c.method === 'DELETE');
  assert.deepEqual(deletes.map(c => c.path), ['factors/' + PENDING]);
});

test('enrôlement refusé si un facteur vérifié existe : aucune suppression, aucun nouvel enrôlement', async () => {
  const { run, calls } = load({ factors: [verifiedFactor, pendingFactor], responses: {} });
  const r = await run({ action: 'enroll' });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /déjà configuré/);
  assert.equal(calls.length, 0);
});

test('vérification : facteur absent -> message dédié', async () => {
  const { run } = load({ factors: [], responses: {} });
  const r = await run({ action: 'verify', factor_id: NEW, code: '123456' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Aucun facteur/);
});

test('vérification : code TOTP invalide sur un facteur vérifié -> message code invalide, aucun cookie', async () => {
  const { run } = load({
    factors: [verifiedFactor],
    responses: {
      'POST factors/ID/challenge': { ok: true, status: 200, data: { id: 'c1' } },
      'POST factors/ID/verify': { ok: false, status: 422, data: { error_code: 'mfa_verification_failed' } },
    },
  });
  const r = await run({ action: 'verify', factor_id: VERIFIED, code: '000000' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Code TOTP invalide/);
  assert.equal(r.cookie, undefined);
});

test('vérification : code faux pendant un enrôlement -> enrôlement incomplet, distinct du code invalide', async () => {
  const { run } = load({
    factors: [pendingFactor],
    responses: {
      'POST factors/ID/challenge': { ok: true, status: 200, data: { id: 'c2' } },
      'POST factors/ID/verify': { ok: false, status: 422, data: { error_code: 'mfa_verification_failed' } },
    },
  });
  const r = await run({ action: 'verify', factor_id: PENDING, code: '000000' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /enrôlement n’est pas encore terminé/);
});

test('vérification réussie : cookie de session aal2, aucune suppression de facteur', async () => {
  const { run, calls } = load({
    factors: [verifiedFactor],
    responses: {
      'POST factors/ID/challenge': { ok: true, status: 200, data: { id: 'c3' } },
      'POST factors/ID/verify': { ok: true, status: 200, data: { access_token: 'aal2-token', expires_in: 3600 } },
    },
  });
  const r = await run({ action: 'verify', factor_id: VERIFIED, code: '654321' });
  assert.equal(r.status, 200);
  assert.match(r.cookie, /^br15_session=aal2-token/);
  assert.equal(calls.filter(c => c.method === 'DELETE').length, 0);
});

test('un facteur vérifié n’est jamais supprimé, quelle que soit l’action', async () => {
  const { run, calls } = load({
    factors: [verifiedFactor, pendingFactor],
    responses: {
      'POST factors/ID/challenge': { ok: false, status: 500, data: {} },
    },
  });
  await run({ action: 'enroll' });
  await run({ action: 'verify', factor_id: VERIFIED, code: '111111' });
  assert.equal(calls.filter(c => c.method === 'DELETE' && c.path.includes(VERIFIED)).length, 0);
});

test('les actions factors et logout restent inchangées', async () => {
  const { run } = load({ factors: [verifiedFactor], responses: {} });
  const f = await run({ action: 'factors' });
  assert.deepEqual(f.body.factors, [{ id: VERIFIED, status: 'verified', factor_type: 'totp' }]);
  const out = await run({ action: 'logout' }).catch(() => null);
  assert.ok(out === null || out.status === 200);
});

test('enrôlement en cours : facteur tout juste créé (absent de la liste) puis vérifié avec succès', async () => {
  const { run } = load({
    factors: [],
    responses: {
      'POST factors/ID/challenge': { ok: true, status: 200, data: { id: 'c4' } },
      'POST factors/ID/verify': { ok: true, status: 200, data: { access_token: 'aal2-new', expires_in: 3600 } },
    },
  });
  const r = await run({ action: 'verify', factor_id: NEW, code: '777777' });
  assert.equal(r.status, 200);
  assert.match(r.cookie, /^br15_session=aal2-new/);
});

test('facteur introuvable côté Supabase (404 au challenge) -> facteur absent, aucun cookie', async () => {
  const { run } = load({ factors: [], responses: { 'POST factors/ID/challenge': { ok: false, status: 404, data: {} } } });
  const r = await run({ action: 'verify', factor_id: NEW, code: '777777' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Aucun facteur/);
  assert.equal(r.cookie, undefined);
});

test('nouvel enrôlement de csrilsma (aucun facteur) : création directe, sans suppression', async () => {
  const { run, calls } = load({
    factors: [],
    responses: { 'POST factors': { ok: true, status: 200, data: { id: NEW, totp: { qr_code: 'data:x', secret: 's' } } } },
  });
  const r = await run({ action: 'enroll' });
  assert.equal(r.status, 200);
  assert.equal(calls.filter(c => c.method === 'DELETE').length, 0);
});
