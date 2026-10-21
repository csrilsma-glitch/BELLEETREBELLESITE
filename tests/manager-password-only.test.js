'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),c=require('../netlify/functions/lib/core');
const ids=['54713825-4afd-4aa4-a763-8423a286831a','09bc28e7-8f02-4cb1-a8ac-29b04cd47185'];
test('exception MFA limitée aux deux identifiants existants, jamais à un email ou claim falsifié',()=>{
 for(const id of ids)assert.equal(c.mfaRequired({id}),false);
 assert.equal(c.mfaRequired({id:'other',email:'csrilsma@gmail.com',user_metadata:{id:ids[0]}}),true);
 assert.equal(c.mfaRequired(null),true);
});
test('les deux comptes accèdent en AAL1 seulement après Auth et droits actifs, aucun appel facteurs',async()=>{
 const savedFetch=global.fetch,savedEnv={...process.env};
 process.env.SUPABASE_URL='https://database.example.test';process.env.SUPABASE_PUBLISHABLE_KEY='public-test';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
 let id,active=true,rejected=false,calls=[];
 global.fetch=async url=>{calls.push(String(url));return String(url).includes('/auth/v1/user')?new Response(JSON.stringify({id}),{status:rejected?401:200}):new Response(JSON.stringify(active?[{active:true}]:[]),{status:200});};
 const token='x.'+Buffer.from(JSON.stringify({aal:'aal1'})).toString('base64url')+'.sig',event={headers:{cookie:'br15_session='+token}};
 try{
 for(id of ids){active=true;rejected=false;assert.equal((await c.manager(event)).user.id,id);active=false;await assert.rejects(c.manager(event),/refusé/);active=true;rejected=true;await assert.rejects(c.manager(event),/Authentification refusée/);}
 assert.equal(calls.some(x=>x.includes('/factors')),false);
 }finally{global.fetch=savedFetch;process.env=savedEnv;}
});
test('login annonce mot de passe seul pour chaque compte autorisé et conserve cookie sécurisé',async()=>{
 const handler=require('../netlify/functions/manager-auth').handler;
 const saved={auth:c.authRequest,db:c.db,rate:c.rate};
 try{c.rate=async()=>{};c.db=async()=>[{active:true}];
 for(const id of ids){c.authRequest=async()=>({user:{id},access_token:'test-only',expires_in:3600});const r=await handler({httpMethod:'POST',headers:{},body:JSON.stringify({action:'login',email:'ignored@example.test',password:'fake'})});assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).mfa_required,false);assert.match(r.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);}
 }finally{Object.assign(c,{authRequest:saved.auth,db:saved.db,rate:saved.rate});}
});
