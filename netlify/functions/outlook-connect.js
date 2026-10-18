const crypto=require('node:crypto'),c=require('./lib/core');
exports.handler=e=>c.wrap(e,async()=>{
 await c.manager(e);if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});
 const state=crypto.randomBytes(32).toString('base64url'),verifier=crypto.randomBytes(48).toString('base64url');
 await c.db('br15_oauth',{method:'POST',data:{state_hash:c.sha(state),verifier,expires:new Date(Date.now()+600000).toISOString()}});
 const q=new URLSearchParams({client_id:c.env('MICROSOFT_CLIENT_ID'),response_type:'code',redirect_uri:c.env('MICROSOFT_REDIRECT_URI'),response_mode:'query',scope:'offline_access Calendars.ReadWrite',state,code_challenge:c.sha(verifier),code_challenge_method:'S256',prompt:'select_account'});
 q.set('code_challenge',crypto.createHash('sha256').update(verifier).digest('base64url'));
 return c.json(200,{url:'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?'+q});
});
