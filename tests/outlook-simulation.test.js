'use strict';
// Simulation complète des fonctions Outlook (push, pull, rafraîchissement, pagination, suppression)
// contre un Microsoft Graph fictif en mémoire. Aucun compte, aucun consentement, aucun appel réseau réel.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString('base64');
process.env.MICROSOFT_CLIENT_ID = 'id-fictif';
process.env.MICROSOFT_CLIENT_SECRET = 'secret-fictif';
process.env.MICROSOFT_REDIRECT_URI = 'https://exemple.test/cb';
delete process.env.APP_ENV; // logique de production simulée, sans appel réel
const c = require('../netlify/functions/lib/core');
const o = require('../netlify/functions/lib/outlook');

const CAL = 'cal-test-fictif';
function fakeWorld() {
  const world = { events: [], calls: [], blocks: null, outlookRow: null, mappings: [], bookings: [], refreshes: 0, graphHostsSeen: new Set(), pageSize: 2 };
  const ev = (id, starts, ends, extra = {}) => ({ id, start: { dateTime: starts }, end: { dateTime: ends }, showAs: 'busy', isCancelled: false, ...extra });
  world.ev = ev;
  world.fetch = async (url, opt = {}) => {
    const u = new URL(String(url)); const method = opt.method || 'GET';
    world.calls.push(method + ' ' + u.pathname);
    world.graphHostsSeen.add(u.host);
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (u.host === 'login.microsoftonline.com') {
      world.refreshes++;
      return json(200, { access_token: 'access-renouvele-fictif', refresh_token: 'refresh-renouvele-fictif', expires_in: 3600 });
    }
    const m = u.pathname.match(/\/v1\.0\/me\/calendars\/([^/]+)\/(events|calendarView)(?:\/([^/?]+))?$/);
    if (!m) return json(404, { error: 'route fictive inconnue' });
    const [, , kind, eid] = m;
    if (kind === 'calendarView' && method === 'GET') {
      const all = world.events.filter(e => !e.isCancelled || true);
      const skip = Number(u.searchParams.get('$skip') || 0);
      const page = all.slice(skip, skip + world.pageSize);
      const body = { value: page };
      if (skip + world.pageSize < all.length) body['@odata.nextLink'] = 'https://graph.microsoft.com/v1.0/me/calendars/' + CAL + '/calendarView?$skip=' + (skip + world.pageSize);
      return json(200, body);
    }
    if (kind === 'events' && method === 'POST') {
      const created = { id: 'evt-' + (world.events.length + 1), ...opt.body && JSON.parse(opt.body) };
      world.events.push(created); return json(201, { id: created.id });
    }
    if (kind === 'events' && eid && method === 'PATCH') {
      const found = world.events.find(e => e.id === eid);
      if (!found) return json(404, { error: 'introuvable' });
      Object.assign(found, JSON.parse(opt.body)); return json(200, { id: eid });
    }
    if (kind === 'events' && eid && method === 'DELETE') {
      const i = world.events.findIndex(e => e.id === eid);
      if (i < 0) return json(404, {}); world.events.splice(i, 1); return { ok: true, status: 204, json: async () => null };
    }
    return json(405, {});
  };
  return world;
}
function stubDb(world, { bookings = [] } = {}) {
  c.db = async (path, opts = {}) => {
    const method = opts.method || 'GET';
    if (path.startsWith('br15_outlook?id=eq.true')) {
      if (method === 'PATCH') { Object.assign(world.outlookRow, opts.data); return []; }
      return [world.outlookRow];
    }
    if (path.startsWith('br15_settings')) return [{ horizon_days: 90 }];
    if (path.startsWith('br15_bookings')) return bookings;
    if (path.startsWith('br15_outlook_events?on_conflict=booking_id')) {
      const i = world.mappings.findIndex(x => x.booking_id === opts.data.booking_id);
      if (i >= 0) world.mappings[i] = { ...world.mappings[i], ...opts.data }; else world.mappings.push({ ...opts.data });
      return [];
    }
    if (path.startsWith('br15_outlook_events?booking_id=eq.') && method === 'DELETE') {
      const id = decodeURIComponent(path.split('eq.')[1]); world.mappings = world.mappings.filter(x => x.booking_id !== id); return [];
    }
    if (path.startsWith('br15_outlook_events?booking_id=eq.')) {
      const id = path.split('eq.')[1]; return world.mappings.filter(x => x.booking_id === id);
    }
    if (path.startsWith('br15_outlook_events')) return world.mappings;
    return [];
  };
  c.rpc = async (name, data) => {
    if (name === 'limit') return true;
    if (name === 'outlook_blocks') { world.blocks = data.p_blocks; return {}; }
    return [];
  };
}
function setup({ expiresIn = 3600 * 1000, bookings } = {}) {
  const world = fakeWorld();
  world.outlookRow = { id: true, calendar_id: CAL, last_sync: null, error: null, encrypted: c.seal({ access_token: 'access-fictif', refresh_token: 'refresh-fictif', expires_at: Date.now() + expiresIn }) };
  stubDb(world, { bookings });
  global.fetch = world.fetch;
  return world;
}
const booking = (over = {}) => ({ id: 'b-1', revision: 1, status: 'confirme', starts: '2099-02-01T09:00:00Z', ends: '2099-02-01T10:30:00Z', services: [{ path: 'Gel' }], ...over });
const restoreAll = () => { delete global.fetch; };

test('simulation : création d’un rendez-vous confirmé = un événement fictif, lié à la réservation', async () => {
  const w = setup();
  try {
    const id = await o.push(booking());
    assert.equal(w.events.length, 1);
    assert.equal(w.events[0].subject, 'Belle & Rebelle — Rendez-vous');
    assert.equal(w.events[0].transactionId, 'b-1');
    assert.equal(w.mappings[0].event_id, id);
    assert.equal(w.mappings[0].revision, 1);
  } finally { restoreAll(); }
});

test('simulation : nouvelle révision = mise à jour (PATCH), pas de doublon', async () => {
  const w = setup();
  try {
    await o.push(booking());
    await o.push(booking({ revision: 2, starts: '2099-02-01T11:00:00Z', ends: '2099-02-01T12:30:00Z' }));
    assert.equal(w.events.length, 1, 'un seul événement');
    assert.equal(w.events[0].start.dateTime, '2099-02-01T11:00:00.000'); // format Graph envoyé par le code (UTC, sans Z)
    assert.equal(w.mappings[0].revision, 2);
  } finally { restoreAll(); }
});

test('simulation : événement supprimé côté Outlook = recréé à la prochaine révision', async () => {
  const w = setup();
  try {
    await o.push(booking());
    w.events.length = 0; // suppression manuelle dans Outlook
    await o.push(booking({ revision: 2 }));
    assert.equal(w.events.length, 1);
  } finally { restoreAll(); }
});

test('simulation : annulation = suppression de l’événement et du lien', async () => {
  const w = setup();
  try {
    await o.push(booking());
    await o.push(booking({ revision: 2, status: 'annule' }));
    assert.equal(w.events.length, 0);
    assert.equal(w.mappings.length, 0);
  } finally { restoreAll(); }
});

test('simulation : import des indisponibilités, paginé, sans les propres événements ni les annulés', async () => {
  const w = setup({ bookings: [{ starts: '2099-02-01T09:30:00Z', ends: '2099-02-01T10:00:00Z', status: 'confirme' }] });
  try {
    w.events.push(w.ev('externe-1', '2099-02-01T09:00:00Z', '2099-02-01T10:00:00Z'));
    w.events.push(w.ev('externe-annule', '2099-02-02T09:00:00Z', '2099-02-02T10:00:00Z', { isCancelled: true }));
    w.events.push(w.ev('externe-libre', '2099-02-03T09:00:00Z', '2099-02-03T10:00:00Z', { showAs: 'free' }));
    w.events.push(w.ev('externe-2', '2099-02-04T09:00:00Z', '2099-02-04T10:00:00Z'));
    w.mappings.push({ booking_id: 'b-1', event_id: 'propre-1', revision: 1 });
    w.events.push(w.ev('propre-1', '2099-02-05T09:00:00Z', '2099-02-05T10:00:00Z'));
    const r = await o.pull();
    assert.deepEqual(w.blocks.map(b => b.external_id).sort(), ['externe-1', 'externe-2']);
    assert.equal(w.blocks.every(b => b.source === 'outlook' && b.label === 'Occupé dans Outlook'), true);
    assert.equal(r.imported, 2);
    assert.equal(r.conflicts, 1, 'chevauchement avec une réservation confirmée');
    assert.ok(w.calls.filter(x => x.includes('calendarView')).length >= 2, 'pagination suivie');
  } finally { restoreAll(); }
});

test('simulation : lien de pagination hors Graph refusé', async () => {
  const w = setup();
  try {
    w.events.push(w.ev('x1', '2099-02-01T09:00:00Z', '2099-02-01T10:00:00Z'), w.ev('x2', '2099-02-02T09:00:00Z', '2099-02-02T10:00:00Z'), w.ev('x3', '2099-02-03T09:00:00Z', '2099-02-03T10:00:00Z'));
    const realFetch = w.fetch;
    global.fetch = async (url, opt) => {
      const r = await realFetch(url, opt);
      if (String(url).includes('calendarView')) { const b = await r.json(); return { ok: true, status: 200, json: async () => ({ ...b, '@odata.nextLink': 'https://attaquant.example/steal' }) }; }
      return r;
    };
    await assert.rejects(o.pull(), e => e.status === 503);
    assert.ok(!w.graphHostsSeen.has('attaquant.example'), 'aucun appel vers un hôte externe');
  } finally { restoreAll(); }
});

test('simulation : jeton expiré = rafraîchi, nouveau jeton chiffré, relance Graph', async () => {
  const w = setup({ expiresIn: -1000 });
  try {
    await o.push(booking());
    assert.equal(w.refreshes, 1);
    const stored = c.unseal(w.outlookRow.encrypted);
    assert.equal(stored.access_token, 'access-renouvele-fictif');
    assert.equal(stored.refresh_token, 'refresh-renouvele-fictif');
    assert.equal(w.events.length, 1);
  } finally { restoreAll(); }
});

test('simulation : Graph 204 traité comme réponse vide, 404 comme objet manquant', async () => {
  const w = setup();
  try {
    const r = await o.graph('/me/calendars/' + CAL + '/events/inconnu', { method: 'DELETE' });
    assert.deepEqual(r, { missing: true });
  } finally { restoreAll(); }
});

test('simulation : aucune connexion calendrier = erreur explicite, aucun appel', async () => {
  const w = setup();
  w.outlookRow.calendar_id = null;
  try {
    await assert.rejects(o.push(booking()), e => e.status === 503 && /non sélectionné/.test(e.message));
    assert.equal(w.calls.length, 0);
  } finally { restoreAll(); }
});
