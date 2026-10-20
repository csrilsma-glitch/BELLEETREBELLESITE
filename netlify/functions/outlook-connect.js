const crypto=require('node:crypto'),c=require('./lib/core'),o=require('./lib/outlook');
exports.handler=e=>c.wrap(e,async()=>{
 await c.manager(e);if(e.httpMethod!=='POST')return c.json(405,{error:'POST requis'});
 const pre=process.env.APP_ENV==='preproduction';
 // Préproduction : parcours de connexion de test uniquement (drapeau + compte de test). Rien n’est écrit avant ce contrôle.
 if(pre&&!o.preprodConnectAllowed())c.fail(503,'Outlook désactivé en préproduction');
 const state=crypto.randomBytes(32).toString('base64url'),verifier=crypto.randomBytes(48).toString('base64url');
 await c.db('br15_oauth',{method:'POST',data:{state_hash:c.sha(state),verifier,expires:new Date(Date.now()+600000).toISOString()}});
 const q=new URLSearchParams({client_id:c.env('MICROSOFT_CLIENT_ID'),response_type:'code',redirect_uri:c.env('MICROSOFT_REDIRECT_URI'),response_mode:'query',scope:pre?'offline_access Calendars.ReadWrite User.Read openid':'offline_access Calendars.ReadWrite',state,code_challenge:c.sha(verifier),code_challenge_method:'S256',prompt:'select_account'});
 q.set('code_challenge',crypto.createHash('sha256').update(verifier).digest('base64url'));
 if(pre)q.set('login_hint',process.env.OUTLOOK_PREPROD_TEST_ACCOUNT);
 return c.json(200,{url:'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?'+q});
});
