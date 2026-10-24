'use strict';
// Date explicite et provenance : aucune disponibilité ni écriture, aucune année déduite d’un jour seul.
const months=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/^(?:oui|non|d['’]accord|ok)[,\s]+/,'');
function parts(text,pending=false){
 const t=norm(text);let m;
 if((m=t.match(/^(\d{4})-(\d{2})-(\d{2})(?:\b|$)/)))return{day:+m[3],month:+m[2],year:+m[1]};
 if((m=t.match(/^(?:le\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?:\b|$)/)))return{day:+m[1],month:+m[2],...(m[3]?{year:+m[3]}:{})};
 const named=new RegExp('^(?:le\\s+)?(\\d{1,2})(?:er)?\\s+('+months.join('|')+')(?:\\s+(\\d{4}))?\\b');
 if((m=t.match(named)))return{day:+m[1],month:months.indexOf(m[2])+1,...(m[3]?{year:+m[3]}:{})};
 const month=new RegExp('^(?:en\\s+)?('+months.join('|')+')(?:\\s+(\\d{4}))?[.! ]*$');
 if((m=t.match(month)))return{month:months.indexOf(m[1])+1,...(m[2]?{year:+m[2]}:{})};
 if(pending&&(m=t.match(/^(\d{4})[.! ]*$/)))return{year:+m[1]};
 if((m=t.match(/^(?:le\s+)?(\d{1,2})(?:er)?(?:\s+(?:(?:au|le)\s+)?(?:matin|apres[- ]?midi))?(?:\s+(?:a|vers)\s+(?:[01]?\d|2[0-3])(?:h(?:[0-5]\d)?|:[0-5]\d))?(?:\s+(?:svp|s['’]il vous plait|merci))?[.!?]*$/)))return{day:+m[1]};
 return null;
}
function question(v){if(!v.day)return 'Quel jour de '+(months[v.month-1]||'ce mois')+(v.year?' '+v.year:'')+' souhaitez-vous ?';if(!v.month)return 'Vous souhaitez le '+v.day+' de quel mois et de quelle année ?';return 'Vous souhaitez le '+v.day+' '+months[v.month-1]+' de quelle année ?';}
function resolve(text,state,p){
 const input=parts(text,Boolean(state.dateParts));
 if(!input){
  if(state.dateParts)return{kind:'clarify',prompt:question(state.dateParts)};
  if(p.hasDateExpression(text)){const date=p.requestedDate([{role:'user',content:text}]);if(date&&p.validDate(date)){state.dateContext={month:+date.slice(5,7),year:+date.slice(0,4)};return{kind:'date',date};}return{kind:'invalid'};}
  return{kind:'none'};
 }
 let v={...(state.dateParts||{}),...input};
 if((v.day!==undefined&&(v.day<1||v.day>31))||(v.month!==undefined&&(v.month<1||v.month>12))||(v.year!==undefined&&(v.year<1900||v.year>9999)))return{kind:'invalid'};
 const offered=input.day&&!input.month&&!input.year&&!state.dateParts?state.alternativeDates?.filter(d=>+d.slice(8)===input.day):[];
 const known=offered?.length===1?{month:+offered[0].slice(5,7),year:+offered[0].slice(0,4)}:state.dateParts?{}:state.dateContext||{};
 v={...known,...v};
 if(v.day&&v.month&&v.year){const date=String(v.year).padStart(4,'0')+'-'+String(v.month).padStart(2,'0')+'-'+String(v.day).padStart(2,'0');
  // Un contexte qui conduirait à une date passée ne prouve pas le mois d’un nouveau jour seul.
  if(date<p.today()&&!input.month&&!input.year&&!state.dateParts){v={day:v.day};}
  else if(!p.validDate(date))return{kind:'invalid'};
  else{delete state.dateParts;state.dateContext={month:v.month,year:v.year};return{kind:'date',date};}
 }
 state.dateParts=v;return{kind:'clarify',prompt:question(v)};
}
module.exports={parts,question,resolve};
