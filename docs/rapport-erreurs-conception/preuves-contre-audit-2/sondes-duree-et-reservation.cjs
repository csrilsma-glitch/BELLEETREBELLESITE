const p=require(process.env.PR_DIR+'/netlify/functions/lib/melba-policy.js');
const m=(...c)=>c.map(x=>({role:'user',content:x}));
for (const t of ['je voudrais un soin de 1h30','1h30 de soin','un soin de 1h30 le matin','je voudrais 1h30 de soin, à 15h','soin de 2h, de 10h à 12h','je voudrais un soin de 1h30 pour mardi'])
  console.log(t.padEnd(36), JSON.stringify(p.preference(m(t))));
for (const r of ["C'est réservé pour vous.","Parfait, c'est noté, à bientôt !","Votre place est bien prise."])
  console.log(('GUARD '+r).padEnd(40), p.needsCalendarEvidence(r));
