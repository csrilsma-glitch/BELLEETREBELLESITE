'use strict';
// Outlook en préproduction : tout bloqué par défaut ; seul le parcours de connexion d’un compte de TEST
// est ouvert, et seulement avec OUTLOOK_PREPROD_TEST=true. Microsoft, Graph et Supabase sont simulés.
const test = require('node:test');
const assert = require('node:assert/strict');
const KEYS = ['APP_ENV', 'OUTLOOK_PREPROD_TEST', 'OUTLOOK_PREPROD_TEST_ACCOUNT', 'SUPABASE_URL', 'EXPECTED_SUPABASE_PROJECT_REF',
  'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET', 'MICROSOFT_REDIRECT_URI', 'SITE_URL'];
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
const c = require('../netlify/functions/lib/core');
const o = require('../netlify/functions/lib/outlook');
const connect = require('../netlify/functions/outlook-connect').handler;
const callback = require('../netlify/functions/outlook-callback').handler;
const manager = require('../netlify/functions/outlook-manager').handler;
const notifications = require('../netlify/functions/lib/notifications');

const PREPROD_REF = 'xrpjrweqdhihloykabml';
const TEST_ACCOUNT = 'compte.test.belle@exemple.test';
const REAL_ACCOUNT = 'vraie.cliente@exemple.test'; // stand-in fictif pour un compte réel
const idToken = pref => ['h', Buffer.from(JSON.stringify({ preferred_username: pref })).toString('base64url'), 's'].join('.');

const realDb = c.db, realRequest = c.request, realManager = c.manager, realRpc = c.rpc, realFetch = global.fetch;
let fetchLog, dbLog, microsoftAccount;
function stub() {
  fetchLog = []; dbLog = [];
  c.manager = async () => ({ user: {}, token: 't' });
  c.rpc = async () => true;
  c.db = async (path, opts = {}) => {
    dbLog.push({ path, method: opts.method || 'GET', data: opts.data });
    if (path.startsWith('br15_oauth') && opts.method === 'DELETE') return [{ verifier: 'verifieur-fictif' }];
    return [];
  };
  global.fetch = async (url) => {
    fetchLog.push(String(url));
    if (String(url).includes('/oauth2/v2.0/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'access-fictif-secret', refresh_token: 'refresh-fictif-secret', expires_in: 3600, id_token: idToken(microsoftAccount) }) };
    }
    throw new Error('appel réseau inattendu : ' + url);
  };
}
function setEnv(vars) {
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, {
    SUPABASE_URL: 'https://' + PREPROD_REF + '.supabase.co', EXPECTED_SUPABASE_PROJECT_REF: PREPROD_REF,
    MICROSOFT_CLIENT_ID: 'id-fictif', MICROSOFT_CLIENT_SECRET: 'secret-fictif', MICROSOFT_REDIRECT_URI: 'https://belleetrebelle-v15-preproduction.netlify.app/.netlify/functions/outlook-callback',
    SITE_URL: 'https://belleetrebelle-v15-preproduction.netlify.app', ...vars,
  });
}
function restore() {
  for (const k of KEYS) delete process.env[k];
  c.db = realDb; c.request = realRequest; c.manager = realManager; c.rpc = realRpc; global.fetch = realFetch;
}
const connectEvent = { httpMethod: 'POST', headers: {}, body: '{}' };
const callbackEvent = { httpMethod: 'GET', headers: {}, queryStringParameters: { code: 'code-fictif', state: 'state-fictif' } };

// 1. Par défaut : aucun accès Outlook en préproduction (drapeau absent ou à false).
for (const flag of [undefined, 'false', '', 'TRUE', '1']) {
  test(`préproduction, drapeau « ${flag} » : tout Outlook reste bloqué`, async () => {
    setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: flag, OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
    stub();
    try {
      assert.equal((await connect(connectEvent)).statusCode, 503, 'connexion refusée');
      assert.equal((await callback(callbackEvent)).statusCode, 503, 'retour refusé');
      assert.equal((await manager({ httpMethod: 'POST', headers: {}, body: '{"action":"calendars"}' })).statusCode, 503, 'calendriers refusés');
      await assert.rejects(o.exchange({ grant_type: 'authorization_code' }, { connectFlow: true }), e => e.status === 503);
      await assert.rejects(o.connection(), e => e.status === 503);
      await assert.rejects(o.graph('/me'), e => e.status === 503);
      await assert.rejects(o.pull(), e => e.status === 503);
      await assert.rejects(o.push({ id: 'b1', starts: '2099-01-01T10:00:00Z', ends: '2099-01-01T11:00:00Z', services: [], status: 'confirme', revision: 1 }), e => e.status === 503);
      assert.deepEqual(dbLog, [], 'aucune écriture en base');
      assert.deepEqual(fetchLog, [], 'aucun appel Microsoft ni Graph');
    } finally { restore(); }
  });
}

// 2. Drapeau à true mais compte de test absent : toujours bloqué.
test('drapeau true sans compte de test configuré : bloqué', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: '' });
  stub();
  try {
    assert.equal((await connect(connectEvent)).statusCode, 503);
    assert.equal((await callback(callbackEvent)).statusCode, 503);
    assert.deepEqual(fetchLog, []); assert.deepEqual(dbLog, []);
  } finally { restore(); }
});

// 3. Drapeau true : seul le parcours de connexion s’ouvre, avec le compte de test en indication.
test('drapeau true : la connexion de test est ouverte, avec scope openid et compte de test', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
  stub();
  try {
    const r = await connect(connectEvent);
    assert.equal(r.statusCode, 200);
    const url = new URL(JSON.parse(r.body).url);
    assert.equal(url.searchParams.get('scope'), 'offline_access Calendars.ReadWrite openid');
    assert.equal(url.searchParams.get('login_hint'), TEST_ACCOUNT);
    assert.ok(dbLog.some(x => x.path === 'br15_oauth' && x.method === 'POST'), 'état OAuth enregistré (base de préproduction)');
  } finally { restore(); }
});
test('drapeau true : Graph, synchronisation, écriture et calendriers restent bloqués', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
  stub();
  try {
    await assert.rejects(o.connection(), e => e.status === 503);
    await assert.rejects(o.graph('/me/calendars'), e => e.status === 503);
    await assert.rejects(o.pull(), e => e.status === 503);
    await assert.rejects(o.push({ id: 'b1', starts: '2099-01-01T10:00:00Z', ends: '2099-01-01T11:00:00Z', services: [], status: 'confirme', revision: 1 }), e => e.status === 503);
    await assert.rejects(o.exchange({ grant_type: 'refresh_token' }), e => e.status === 503, 'rafraîchissement refusé hors parcours de connexion');
    for (const action of ['calendars', 'select', 'sync']) {
      const r = await manager({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action, calendar_id: 'x' }) });
      assert.equal(r.statusCode, 503, action);
    }
    assert.deepEqual(fetchLog, [], 'aucun appel Graph');
    assert.ok(!dbLog.some(x => x.method === 'POST' && String(x.path).includes('br15_outlook_events')), 'aucun événement enregistré');
  } finally { restore(); }
});

// 4. Compte de test : jeton chiffré, stocké uniquement dans la base de préproduction.
test('drapeau true, compte de test : jeton chiffré et stocké dans la base de préproduction uniquement', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
  stub(); microsoftAccount = TEST_ACCOUNT;
  try {
    const r = await callback(callbackEvent);
    assert.equal(r.statusCode, 303);
    const saved = dbLog.find(x => x.path.startsWith('br15_outlook?on_conflict=id'));
    assert.ok(saved, 'jeton enregistré');
    assert.equal(typeof saved.data.encrypted, 'string');
    assert.ok(!saved.data.encrypted.includes('access-fictif-secret'), 'jeton non lisible en clair');
    assert.ok(!saved.data.encrypted.includes('refresh-fictif-secret'), 'refresh non lisible en clair');
    assert.equal(saved.data.calendar_id, null, 'aucun calendrier choisi automatiquement');
    assert.deepEqual(fetchLog.filter(u => !u.includes('/oauth2/v2.0/token')), [], 'seul l’échange de jeton, aucun Graph');
    assert.ok(fetchLog.every(u => u.startsWith('https://login.microsoftonline.com/')));
    // Le jeton ne peut être déchiffré qu’avec la clé de l’environnement de préproduction.
    assert.equal(c.unseal(saved.data.encrypted).access_token, 'access-fictif-secret');
  } finally { restore(); }
});

// 5. Autre compte (y compris un compte réel) : refus, rien stocké, aucun accès.
for (const [label, account] of [['autre compte', REAL_ACCOUNT], ['id_token sans identifiant', null]]) {
  test(`drapeau true, ${label} : refusé, rien stocké`, async () => {
    setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
    stub(); microsoftAccount = account;
    try {
      const r = await callback(callbackEvent);
      assert.equal(r.statusCode, 403);
      assert.ok(!dbLog.some(x => x.path.startsWith('br15_outlook?on_conflict=id')), 'aucun jeton enregistré');
      assert.ok(!JSON.stringify(dbLog).includes('encrypted'));
      assert.ok(fetchLog.every(u => u.includes('/oauth2/v2.0/token')), 'aucun appel Graph');
    } finally { restore(); microsoftAccount = null; }
  });
}

// 6. Base de production : refus avant tout échange Microsoft.
test('drapeau true, base de production : refus avant tout échange', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT,
    SUPABASE_URL: 'https://mlbfnlidlvsqghcijuhw.supabase.co', EXPECTED_SUPABASE_PROJECT_REF: 'autre-ref-test' });
  fetchLog = []; global.fetch = async u => { fetchLog.push(String(u)); throw new Error('réseau interdit'); };
  c.manager = async () => ({ user: {}, token: 't' });
  try {
    const r = await callback(callbackEvent); // vrai c.db : l’isolation doit refuser
    assert.equal(r.statusCode, 503);
    assert.deepEqual(fetchLog, [], 'aucun appel Microsoft ni Supabase de production');
  } finally { restore(); }
});

// 7. Notifications : la file reste simulée, même drapeau activé.
test('drapeau true : l’envoi Outlook de la file reste simulé', async () => {
  setEnv({ APP_ENV: 'preproduction', OUTLOOK_PREPROD_TEST: 'true', OUTLOOK_PREPROD_TEST_ACCOUNT: TEST_ACCOUNT });
  stub();
  const db = c.db;
  c.db = async path => path.startsWith('br15_bookings') ? [{ id: 'b1', revision: 1, status: 'confirme', starts: '2099-01-01T10:00:00Z', ends: '2099-01-01T11:00:00Z', created_at: '2026-10-20T08:00:00Z', services: [], cents: 0, request_key: 'k' }] : [];
  try {
    const r = await notifications.deliver({ id: 'j1', kind: 'outlook', booking_id: 'b1', dedupe: 'b1:1:outlook', payload: { revision: 1 } });
    assert.equal(r.provider_id, 'preprod-simulated');
    assert.deepEqual(fetchLog, []);
  } finally { c.db = db; restore(); }
});

// 8. Production : comportement inchangé (scope identique, sans compte de test).
test('production : scope et connexion inchangés', async () => {
  setEnv({ APP_ENV: undefined });
  stub();
  try {
    const r = await connect(connectEvent);
    assert.equal(r.statusCode, 200);
    const url = new URL(JSON.parse(r.body).url);
    assert.equal(url.searchParams.get('scope'), 'offline_access Calendars.ReadWrite');
    assert.equal(url.searchParams.get('login_hint'), null);
  } finally { restore(); }
});
