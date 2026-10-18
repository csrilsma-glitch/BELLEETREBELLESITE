'use strict';
// Tests unitaires des validateurs et du chiffrement de lib/core.js.
// Données fictives uniquement, aucun appel réseau, aucune base.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.BOOKING_SIGNING_KEY = 'test-signing-key-fictif';
const c = require('../netlify/functions/lib/core');

test('phone: accepte un mobile français et normalise en +33', () => {
  assert.equal(c.phone('06 12 34 56 78'), '+33612345678');
  assert.equal(c.phone('+33612345678'), '+33612345678');
});

test('phone: rejette un numéro invalide', () => {
  assert.throws(() => c.phone('123'), /Téléphone/);
  assert.throws(() => c.phone(''), /Téléphone/);
});

test('date: accepte uniquement AAAA-MM-JJ réelle', () => {
  assert.equal(c.date('2026-10-19'), '2026-10-19');
  assert.throws(() => c.date('2026-02-30'), /Date/);
  assert.throws(() => c.date('19/10/2026'), /Date/);
});

test('ids: refuse doublons, vide et plus de 12 prestations', () => {
  assert.deepEqual(c.ids(['vernis-semi', 'pose-gel']), ['vernis-semi', 'pose-gel']);
  assert.throws(() => c.ids(['a', 'a']), /Sélection/);
  assert.throws(() => c.ids([]), /Sélection/);
  assert.throws(() => c.ids(Array.from({ length: 13 }, (_, i) => 's' + i)), /Sélection/);
  assert.throws(() => c.ids(['Mauvais ID']), /Sélection/);
});

test('uuid et instant', () => {
  assert.ok(c.uuid('123e4567-e89b-42d3-a456-426614174000'));
  assert.throws(() => c.instant('2026-10-19 10:00'), /Horaire/);
  assert.equal(c.instant('2026-10-19T10:00:00Z'), '2026-10-19T10:00:00Z');
});

test('body: refuse JSON invalide et corps trop grand', () => {
  assert.deepEqual(c.body({ body: '{"a":1}' }), { a: 1 });
  assert.throws(() => c.body({ body: '{' }), /JSON/);
  assert.throws(() => c.body({ body: 'x'.repeat(24001) }), /volumineuse/);
});

test('sha: déterministe et hexadécimal', () => {
  assert.equal(c.sha('abc'), c.sha('abc'));
  assert.match(c.sha('abc'), /^[0-9a-f]{64}$/);
});

test('seal/unseal: aller-retour AES-256-GCM', () => {
  const sealed = c.seal('jeton-fictif');
  assert.notEqual(sealed, 'jeton-fictif');
  assert.equal(c.unseal(sealed), 'jeton-fictif');
});

test('unseal: rejette une donnée altérée', () => {
  const sealed = c.seal('jeton-fictif');
  const buf = Buffer.from(sealed, 'base64');
  buf[buf.length - 1] ^= 0xff;
  assert.throws(() => c.unseal(buf.toString('base64')));
});
