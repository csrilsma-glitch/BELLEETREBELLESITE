/* Le catalogue serveur met à jour les libellés/tarifs sans changer le crâne. */
(async()=>{try{const r=await fetch('/.netlify/functions/catalog',{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(!Array.isArray(d.services)||!d.services.length)return;
 const root=window.BR_TREE,flat=window.BR_PRESTATIONS;if(!root||!flat)return;
 const groupIds=new Map();function remember(node,path=[]){for(const n of node.children||[]){const p=[...path,n.name];if(n.children){groupIds.set(p.join(' › '),n.id);remember(n,p);}}}remember(root);
 const children=[];let n=0;for(const s of d.services){const parts=s.path.split(' › ').map(x=>x.trim());let current=children;for(let i=0;i<parts.length-1;i++){let group=current.find(x=>x.children&&x.name===parts[i]);if(!group){const prefix=parts.slice(0,i+1).join(' › ');group={id:groupIds.get(prefix)||'category-'+(++n),name:parts[i],children:[]};current.push(group);}current=group.children;}
 const dur=Math.floor(s.minutes/60)+'h'+String(s.minutes%60).padStart(2,'0'),leaf={id:s.id,name:s.name,path:s.path,dur,price:s.cents/100};current.push(leaf);flat[s.id]={...flat[s.id],...leaf};}
 for(const id of Object.keys(flat))if(!d.services.some(s=>s.id===id))delete flat[id];root.children=children;window.dispatchEvent(new Event('br-catalogue'));
}catch{ /* Le catalogue d’origine reste consultable hors ligne ; réservation serveur obligatoire. */ }})();
