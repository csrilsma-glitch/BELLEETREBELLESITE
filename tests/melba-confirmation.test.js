// Suite de confirmation isolée : seul le clic explicite crée une réservation, avec une base simulée.
// Aucune donnée réelle, aucun e-mail, aucun SMS : la base est remplacée par des fonctions de test.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('crypto');
process.env.BOOKING_SIGNING_KEY=process.env.BOOKING_SIGNING_KEY||'test-signing-only';
const root=process.env.BR_CONFIRM_ROOT||require('path').resolve(__dirname,'..');
const reservations=require(root+'/netlify/functions/reservations'),c=require(root+'/netlify/functions/lib/core');

const saved={db:c.db,rpc:c.rpc,rate:c.rate,origin:c.origin,env:process.env.NATIVE_BOOKING_ENABLED};
let bookCalls;
function mock(bookImpl){
 bookCalls=[];
 process.env.NATIVE_BOOKING_ENABLED='true';
 c.db=async q=>q.startsWith('br15_settings')?[{id:true,enabled:true,outlook_required:false}]:[];
 c.rate=async()=>{};c.origin=()=>{};
 c.rpc=async(name,args)=>{
  if(name==='limit')return true;
  if(name==='book'){bookCalls.push(args);return bookImpl(args);}
  return null;
 };
}
function restore(){c.db=saved.db;c.rpc=saved.rpc;c.rate=saved.rate;c.origin=saved.origin;process.env.NATIVE_BOOKING_ENABLED=saved.env;}

function body(over={}){
 return {consent:true,confirmed:true,request_key:crypto.randomUUID(),service_ids:['press-kit-seul'],starts:'2026-10-27T09:40:00Z',client_name:'Cliente Test',client_phone:'0600000000',client_email:'test@example.com',...over};
}
const ok=args=>({id:'11111111-1111-4111-8111-111111111111',starts:args.p_start,ends:args.p_start,services:['press-kit-seul'],cents:2500,minutes:30,status:'confirme'});

test('Confirmation explicite : une réservation est créée et renvoyée',async()=>{
 mock(ok);
 try{
  const r=await reservations.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body())});
  assert.equal(r.statusCode,201);
  const out=JSON.parse(r.body);
  assert.equal(out.ok,true);
  assert.equal(out.booking.status,'confirme');
  assert.equal(bookCalls.length,1,'une seule écriture');
  assert.equal(bookCalls[0].p_name,'Cliente Test');
 }finally{restore();}
});

test('Créneau pris entre-temps : refus clair, aucune réservation affirmée',async()=>{
 mock(()=>{c.fail(409,'Ce créneau n’est plus disponible');});
 try{
  const r=await reservations.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body())});
  assert.notEqual(r.statusCode,201);
  const out=JSON.parse(r.body);
  assert.equal(out.ok,undefined);
  assert.match(out.error,/plus disponible/);
 }finally{restore();}
});

test('Sans confirmation explicite : aucune écriture',async()=>{
 mock(ok);
 try{
  const r=await reservations.handler({httpMethod:'POST',headers:{},body:JSON.stringify(body({confirmed:false}))});
  assert.equal(r.statusCode,400);
  assert.equal(bookCalls.length,0,'aucune écriture sans clic');
 }finally{restore();}
});
