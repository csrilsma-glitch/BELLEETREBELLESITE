/* Belle & Rebelle V10 — un seul choix actif, un catalogue partagé. */
(() => {
  'use strict';
  const TREE = window.BR_TREE, FLAT = Object.create(null), KEY = 'br-selection-v10';
  function walk(node, path = [], ids = []) {
    for (const child of node.children || []) {
      const next = [...path, child.name], branch = [...ids, child.id];
      if (child.children) walk(child, next, branch);
      else FLAT[child.id] = { ...child, path: next.join(' › '), branch };
    }
  }
  walk(TREE);
  const fmtDur = d => {
    const m = /^(\d+)h(\d{2})$/.exec(d || '');
    return !m ? '' : (+m[1] ? `${+m[1]} h${+m[2] ? ' ' + m[2] : ''}` : `${+m[2]} min`);
  };
  const fmtPrice = p => p === 0 ? 'Offert' : new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR',maximumFractionDigits:2}).format(p);
  const fmtLine = p => `${fmtDur(p.dur)} · ${fmtPrice(p.price)}`;
  const validIds = value => [...new Set(Array.isArray(value) ? value.filter(id => Object.hasOwn(FLAT, id)) : [])];
  let selected = [];
  try { selected = validIds(JSON.parse(sessionStorage.getItem(KEY) || '[]')); } catch (_) {}
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(selected)); } catch (_) {} }
  function setSelected(ids) { selected = validIds(ids); save(); window.dispatchEvent(new Event('br-selection')); }
  const getSelected = () => [...selected];
  const bookingUrl = () => 'reservation.html' + (selected.length ? '?prestations=' + encodeURIComponent(selected.join(',')) : '');
  window.BR_PRESTATIONS = FLAT;
  window.BR_FORMAT = {fmtDur,fmtPrice,fmtLine};
  window.BR_SELECTION = {get:getSelected,set:setSelected,url:bookingUrl};
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function renderSelection() {
    const list = document.getElementById('selection-list');
    if (!list) return;
    list.replaceChildren();
    if (!selected.length) list.append(el('li','empty-selection','Votre sélection commence ici. Explorez le crâne pour trouver votre prestation.'));
    for (const id of selected) {
      const p = FLAT[id], row = el('li','selected-service'), copy = el('div');
      copy.append(el('strong','',p.name),el('small','',p.path.split(' › ').slice(1,-1).join(' › ')),el('span','',fmtLine(p)));
      const remove = el('button','remove-service','×'); remove.type='button';
      remove.setAttribute('aria-label','Retirer : '+p.path);
      remove.addEventListener('click',()=>setSelected(selected.filter(x=>x!==id)));
      row.append(copy,remove); list.append(row);
    }
    const total = selected.reduce((sum,id)=>sum+FLAT[id].price,0);
    document.getElementById('selection-total').textContent=selected.length?`Total indicatif : ${fmtPrice(total)}`:'';
    const link=document.getElementById('selection-book');
    link.href=bookingUrl(); link.textContent=selected.length?'Continuer vers la réservation ↗':'Réserver sans sélection ↗';
    document.getElementById('selection-add').hidden=!selected.length;
  }
  window.addEventListener('br-selection',renderSelection); renderSelection();
  window.addEventListener('br-catalogue',()=>{selected=validIds(selected);save();renderSelection();});
  const root=document.getElementById('skull');
  if (!root) return;
  const $=id=>document.getElementById(id), stage=$('sk-body'), crumbs=$('sk-crumbs');
  let levels=[{node:TREE,index:0}];
  const top=()=>levels[levels.length-1], items=()=>top().node.children;
  // Recadrage des photographies transmises, sans remplacer les originaux.
  function makePhoto(item) {
    const ids=[...levels.map(l=>l.node.id),item.id];
    let src='assets/familles-onglerie.jpg',size=[1349,359],crop;
    if(ids.includes('press')){src='assets/familles-principales.jpg';size=[529,283];crop=[280,100,228,93];}
    else if(ids.includes('deposes')){src='assets/depose-reference.jpg';size=[362,311];crop=[40,17,265,168];}
    else if(ids.includes('casse'))crop=[1070,18,238,144];
    else if(ids.includes('semi'))crop=[555,18,237,144];
    else if(ids.includes('capsule'))crop=[298,18,237,144];
    else if(ids.includes('gel'))crop=[40,18,237,144];
    else crop=[813,18,237,144];
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',crop.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    svg.setAttribute('aria-hidden','true');svg.classList.add('choice-photo');
    const image=document.createElementNS('http://www.w3.org/2000/svg','image');
    image.setAttribute('href',src);image.setAttribute('width',size[0]);image.setAttribute('height',size[1]);
    svg.append(image);return svg;
  }
  const focusStage=()=>root.focus({preventScroll:true});
  function render(){
    const level=top(),list=items();level.index=Math.max(0,Math.min(level.index,list.length-1));
    const current=list[level.index];crumbs.replaceChildren();
    levels.forEach((l,i)=>{
      if(i)crumbs.append(el('span','sk-sep','›'));
      const crumb=el(i===levels.length-1?'span':'button','sk-crumb',l.node.name);
      if(i<levels.length-1){crumb.type='button';crumb.addEventListener('click',()=>{levels=levels.slice(0,i+1);render();focusStage();});}
      else crumb.setAttribute('aria-current','step');
      crumbs.append(crumb);
    });
    const card=el('button','active-choice');card.type='button';card.setAttribute('aria-label','Valider : '+current.name);card.addEventListener('click',validate);card.append(makePhoto(current),el('span','choice-name',current.name));stage.replaceChildren(card);
    $('sk-title').textContent=current.name;
    $('sk-step').textContent=`Étape ${levels.length} · ${level.index+1} / ${list.length} choix`;
    $('sk-choice').textContent=current.children?`${current.children.length} possibilités · Validez pour découvrir la suite.`:`${fmtLine(current)} · Tarif du catalogue fourni.`;
    $('sk-validate').textContent=current.children?'VALIDER':selected.includes(current.id)?'AJOUTÉE ✓':'CHOISIR';
    $('sk-validate').setAttribute('aria-label',current.children?'Valider : '+current.name:'Ajouter à la sélection : '+FLAT[current.id].path);
    $('sk-back').disabled=levels.length===1;$('sk-prev').disabled=level.index===0;$('sk-next').disabled=level.index===list.length-1;
    root.dataset.activeId=current.id;
  }
  function move(delta){top().index+=delta;render();}
  function validate(){
    const c=items()[top().index];
    if(c.children){levels.push({node:c,index:0});render();focusStage();}
    else{setSelected([...selected,c.id]);render();$('sk-choice').textContent=`${c.name} ajoutée à votre sélection. Continuez vers la réservation ou ajoutez une autre prestation.`;$('selection-book').focus({preventScroll:true});}
  }
  $('sk-prev').addEventListener('click',()=>move(-1));$('sk-next').addEventListener('click',()=>move(1));
  $('sk-validate').addEventListener('click',validate);
  $('sk-back').addEventListener('click',()=>{if(levels.length>1){levels.pop();render();focusStage();}});
  $('selection-add').addEventListener('click',()=>{levels=[{node:TREE,index:0}];render();root.scrollIntoView({behavior:'auto',block:'center'});focusStage();});
  root.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}
    if(e.key==='Enter'&&e.target===root){e.preventDefault();validate();}
  });
  let start=null;
  root.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.target.closest('button'))start=[e.clientX,e.clientY];});
  root.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);});
  root.addEventListener('pointercancel',()=>{start=null;});
  window.addEventListener('br-catalogue',()=>{selected=validIds(selected);save();levels=[{node:TREE,index:0}];renderSelection();render();});
  render();
})();
