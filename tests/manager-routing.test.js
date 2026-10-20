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

test('hours, unblock, settings, service passent par rpc admin', async () => {
  for (const action of ['hours', 'unblock', 'settings', 'service']) {
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

test('calendrier mensuel : le début et la fin du mois sont chargés même le 31',async()=>{
 const calls=setup();await handler(event({action:'dashboard',date:'2026-10-31'}));
 const query=calls.find(x=>x.kind==='db'&&x.path.startsWith('br15_bookings')).path;
 assert(query.includes('starts=gte.2026-09-24T00:00:00.000Z'));
 assert(query.includes('starts=lt.2026-11-08T00:00:00.000Z'));
});

test('historique cliente : filtre UUID obligatoire, aucun filtre de mois',async()=>{
 let calls=setup();assert.equal((await handler(event({action:'history',id:'x&select=*'}))).statusCode,400);assert.equal(calls.length,0);
 calls=setup();const response=await handler(event({action:'history',id:UUID}));
 assert.equal(response.statusCode,200);assert.deepEqual(JSON.parse(response.body),{bookings:[]});
 assert(calls[0].path.includes('client_id=eq.'+UUID));assert(!calls[0].path.includes('starts=gte.'));
});

// Recette V15 : périodes bloquées validées avant écriture, notes vérifiées après écriture.
test('block : fin avant début, dates invalides ou motif vide refusés sans aucun appel base',async()=>{
 const bad=[
  {starts:'2026-10-29T12:00:00+01:00',ends:'2026-10-21T13:00:00+02:00',label:'Teste. Pause'},
  {starts:'2026-10-29T12:00:00+01:00',ends:'2026-10-29T12:00:00+01:00',label:'Pause'},
  {starts:'pas-une-date',ends:'2026-10-29T13:00:00+01:00',label:'Pause'},
  {starts:'2026-10-29T12:00:00+01:00',ends:'2026-10-29T13:00:00+01:00',label:'   '},
 ];
 for(const data of bad){const calls=setup();const r=await handler(event({action:'block',data}));assert.equal(r.statusCode,400,JSON.stringify(data));assert.equal(calls.length,0);}
});
test('block : période valide envoyée en ISO UTC avec motif borné',async()=>{
 const calls=setup();const r=await handler(event({action:'block',data:{starts:'2026-10-29T12:00:00+01:00',ends:'2026-10-29T13:00:00+01:00',label:'  Pause  '}}));
 assert.equal(r.statusCode,200);const rpc=calls.find(x=>x.kind==='rpc');assert.equal(rpc.name,'admin');assert.equal(rpc.args.p_action,'block');
 assert.deepEqual(rpc.args.p_data,{starts:'2026-10-29T11:00:00.000Z',ends:'2026-10-29T12:00:00.000Z',label:'Pause'});
});
test('client : notes relues après écriture ; échec signalé si la note n’a pas changé',async()=>{
 const save=c.db;
 try{
  let calls=setup();c.db=async p=>{calls.push({kind:'db',path:p});return [{notes:'Bonjour'}];};
  let r=await handler(event({action:'client',data:{id:UUID,notes:'Bonjour'}}));
  assert.equal(r.statusCode,200);assert.equal(calls.find(x=>x.kind==='rpc').name,'admin');
  assert.ok(calls.some(x=>x.kind==='db'&&x.path==='br15_clients?select=notes&id=eq.'+UUID));
  calls=setup();c.db=async()=>[{notes:'ancienne note'}];
  r=await handler(event({action:'client',data:{id:UUID,notes:'Nouvelle note'}}));
  assert.equal(r.statusCode,503);assert.match(JSON.parse(r.body).error,/Notes non enregistrées/);
  calls=setup();c.db=async()=>[];
  r=await handler(event({action:'client',data:{id:UUID,notes:'x'}}));
  assert.equal(r.statusCode,503);
 }finally{c.db=save;}
});
test('client : identifiant non UUID refusé sans appel',async()=>{
 const calls=setup();const r=await handler(event({action:'client',data:{id:'x',notes:'n'}}));
 assert.equal(r.statusCode,400);assert.equal(calls.length,0);
});
test('client : notes trop longues refusées sans écriture ni perte silencieuse',async()=>{
 const calls=setup();const long='é'.repeat(4500);c.db=async()=>[{notes:'é'.repeat(4000)}];
 const r=await handler(event({action:'client',data:{id:UUID,notes:long}}));
 assert.equal(r.statusCode,400);assert.equal(calls.length,0);assert.match(JSON.parse(r.body).error,/4000/);
});

test('block : champs null, numériques, tableaux et objets refusés avant écriture',async()=>{
 for(const value of [null,0,[],{},true]){const calls=setup();const r=await handler(event({action:'block',data:{starts:value,ends:'2026-11-05T12:00:00Z',label:'Test'}}));assert.equal(r.statusCode,400,JSON.stringify(value));assert.equal(calls.length,0);}
});

test('client : texte absent ou non textuel refusé sans effacer les notes',async()=>{for(const notes of [undefined,null,42,{},[]]){const calls=setup();const r=await handler(event({action:'client',data:{id:UUID,notes}}));assert.equal(r.statusCode,400);assert.equal(calls.length,0);}});
