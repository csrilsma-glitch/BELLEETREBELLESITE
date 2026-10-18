'use strict';
// Routage des actions du Manager (netlify/functions/manager.js) avec base et RPC simulées.
// Aucune connexion réseau, aucune donnée réelle.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.BOOKING_SIGNING_KEY = 'test-signing-key-fictif';
const c = require('../netlify/functions/lib/core');
const { PUBLIC } = c;
const b = require('../netlify/functions/lib/booking');
const handler = require('../netlify/functions/manager').handler;

const UUID = '123e4567-e89b-42d3-a456-426614174000';

function setup() {
  const calls = [];
  c.manager = async () => ({ user: { id: 'manager-fictif' }, token: 't' });
  c.rpc = async (name, args) => { calls.push({ kind: 'rpc', name, args }); return { ok: true, id: UUID }; };
  c.db = async (path) => { calls.push({ kind: 'db', path }); return []; };
  b.settings = async () => ({ enabled: false, timezone: 'Europe/Paris' });
  return calls;
}
const event = (body) => ({ httpMethod: 'POST', headers: { origin: PUBLIC }, body: JSON.stringify(body) });

test('hours, block, unblock, settings, service, client passent par rpc admin', async () => {
  for (const action of ['hours', 'block', 'unblock', 'settings', 'service', 'client']) {
    const calls = setup();
    const r = await handler(event({ action, data: { x: 1 } }));
    assert.equal(r.statusCode, 200, action);
    const rpc = calls.find(x => x.kind === 'rpc');
    assert.equal(rpc.name, 'admin', action);
    assert.equal(rpc.args.p_action, action);
    assert.deepEqual(rpc.args.p_data, { x: 1 });
  }
});

test('cancel et complete passent par rpc change avec droits Manager', async () => {
  for (const action of ['cancel', 'complete']) {
    const calls = setup();
    const r = await handler(event({ action, id: UUID }));
    assert.equal(r.statusCode, 200, action);
    const rpc = calls.find(x => x.kind === 'rpc');
    assert.equal(rpc.name, 'change');
    assert.equal(rpc.args.p_action, action);
    assert.equal(rpc.args.p_manager, true);
  }
});

test('cancel refuse un identifiant non UUID sans appel base', async () => {
  const calls = setup();
  const r = await handler(event({ action: 'cancel', id: 'pas-un-uuid' }));
  assert.equal(r.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('erase-client exige un UUID et appelle erase_client', async () => {
  let calls = setup();
  assert.equal((await handler(event({ action: 'erase-client', id: 'x' }))).statusCode, 400);
  calls = setup();
  const r = await handler(event({ action: 'erase-client', id: UUID }));
  assert.equal(r.statusCode, 200);
  assert.equal(calls.find(x => x.kind === 'rpc').name, 'erase_client');
});

test('action inconnue et méthode GET refusées', async () => {
  setup();
  assert.equal((await handler(event({ action: 'supprime-tout' }))).statusCode, 400);
  assert.equal((await handler({ httpMethod: 'GET', headers: { origin: PUBLIC }, body: '' })).statusCode, 405);
});

test('dashboard lit les tables Manager et renvoie les clés attendues', async () => {
  const calls = setup();
  const r = await handler(event({ action: 'dashboard', date: '2026-10-19' }));
  assert.equal(r.statusCode, 200);
  const body = JSON.parse(r.body);
  for (const k of ['bookings', 'clients', 'services', 'hours', 'blocks', 'settings', 'jobs', 'outlook']) {
    assert.ok(k in body, k);
  }
  assert.ok(calls.some(x => x.kind === 'db' && x.path.startsWith('br15_services')));
});
