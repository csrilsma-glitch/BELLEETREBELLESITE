// Usage : PR_DIR=/chemin/vers/checkout-de-la-PR node adversarial-*.cjs  (la branche fix/20261023-melba-creneaux doit être extraite)
process.env.BOOKING_SIGNING_KEY='test-signing-only'; process.env.NATIVE_BOOKING_ENABLED='true';
const W=process.env.PR_DIR+'/netlify/functions/';
const c=require(W+'lib/core'), b=require(W+'lib/booking'), chat=require(W+'chat');
const calls=[];
b.availability=async(date)=>{calls.push(date);return [{starts:date+'T08:00:00Z'},{starts:date+'T09:00:00Z'}];};
c.rpc=async()=>({services:[],minutes:60,cents:5000});
(async()=>{
 // Cas A : msg1 "demain", msg2 "plutôt vendredi" ; le modèle demande vendredi 2026-10-30
 const ctx={requestedDate:'2026-10-24',preference:'morning'};
 await chat._test.nativeRunTool('check_availability',{date:'2026-10-30',service_ids:['gel-gainage']},ctx);
 console.log('Cas A  date demandée par le modèle : 2026-10-30 (vendredi) ; date interrogée :',calls.at(-1));

 // Cas B : préférence "après-midi" ; aucun créneau le matin ; l'alternative doit être vérifiée
 calls.length=0;
 const ctx2={requestedDate:'2026-10-24',preference:'afternoon'};
 const r=await chat._test.nativeRunTool('check_availability',{date:'2026-10-24',service_ids:['gel-gainage']},ctx2);
 console.log('Cas B  appels fournisseur pour une demande sans créneau :',calls.length,'(plafond attendu ~8) ; résultat alternative :',r.alternative||false);
})().catch(e=>console.error('ERR',e.message));
