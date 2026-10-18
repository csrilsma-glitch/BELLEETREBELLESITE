// Sélecteur de prestations en forme de crâne.
// Parcours : Onglerie > famille > sous-famille > prestation, puis « Valider ».
// Durées et tarifs issus des fiches de prestations de Mélanie.
// sb = identifiant du service dans SimplyBook (à compléter plus tard).
(function () {
  const TREE = {
    id: 'onglerie', name: 'Onglerie', children: [
      { id: 'gel', name: 'Prestation gel', children: [
        { id: 'gel-gainage', name: 'Gel sans rallongement (gainage)', dur: '1h30', price: 52 },
        { id: 'gel-chablon', name: 'Extension chablon', dur: '2h00', price: 60 },
        { id: 'gel-premiere', name: '1ère pose sur ongles rongés', dur: '1h15', price: 55 },
        { id: 'gel-remp-34', name: 'Remplissage entre 3 et 4 semaines de repousse', dur: '1h30', price: 45 },
        { id: 'gel-remp-5', name: 'Remplissage après 5 semaines de repousse', dur: '1h30', price: 49 },
      ]},
      { id: 'capsule', name: 'Prestation capsule', children: [
        { id: 'americaine', name: 'Pose américaine', children: [
          { id: 'am-courte', name: 'Courte ou médium', dur: '1h30', price: 48 },
          { id: 'am-longue', name: 'Longue', dur: '1h30', price: 58 },
        ]},
        { id: 'popits', name: 'Rallongement popits et demi-popits', children: [
          { id: 'popits-court', name: 'Popits courts ou médium', dur: '2h00', price: 55 },
          { id: 'popits-long', name: 'Popits longs', dur: '2h30', price: 63 },
          { id: 'demi-court', name: 'Demi-popits courts ou médium', dur: '2h00', price: 59 },
          { id: 'demi-long', name: 'Demi-popits longs', dur: '2h30', price: 66 },
          { id: 'popits-amande', name: 'Popits amande russe', dur: '3h00', price: 70 },
        ]},
      ]},
      { id: 'semi', name: 'Semi-permanent', children: [
        { id: 'semi-main-1', name: 'Semi-permanent renforcé mains, 1ère pose', dur: '0h45', price: 35 },
        { id: 'semi-main-entretien', name: 'Entretien semi-permanent mains', dur: '0h45', price: 40 },
        { id: 'semi-pied-1', name: 'Semi-permanent renforcé pieds, 1ère pose', dur: '0h45', price: 32 },
        { id: 'semi-pied-entretien', name: 'Entretien semi-permanent pieds', dur: '0h45', price: 36 },
      ]},
      { id: 'deco', name: 'Déco nail arts', children: [
        { id: 'deco-simple', name: 'Déco simple', children: [
          { id: 'deco-simple-unite', name: 'Déco très simple à l\'unité', dur: '0h15', price: 2 },
          { id: 'deco-simple-mains', name: 'Déco très simple, forfait mains complètes', dur: '0h30', price: 14 },
        ]},
        { id: 'deco-elab', name: 'Déco élaborée', children: [
          { id: 'fc', name: 'French classique', children: [
            { id: 'fc-2', name: '2 doigts', dur: '0h05', price: 4 },
            { id: 'fc-4', name: '4 doigts', dur: '0h10', price: 8 },
            { id: 'fc-6', name: '6 doigts', dur: '0h20', price: 12 },
            { id: 'fc-mains', name: 'Mains complètes', dur: '0h30', price: 14 },
          ]},
          { id: 'fo', name: 'French originale', children: [
            { id: 'fo-2', name: '2 doigts', dur: '0h05', price: 6 },
            { id: 'fo-4', name: '4 doigts', dur: '0h10', price: 12 },
            { id: 'fo-6', name: '6 doigts', dur: '0h20', price: 18 },
            { id: 'fo-mains', name: 'Mains complètes', dur: '0h30', price: 21 },
          ]},
          { id: 'fr', name: 'French reverse', children: [
            { id: 'fr-2', name: '2 doigts', dur: '0h20', price: 10 },
            { id: 'fr-4', name: '4 doigts', dur: '0h30', price: 18 },
            { id: 'fr-6', name: '6 doigts', dur: '0h40', price: 26 },
            { id: 'fr-mains', name: 'Mains complètes', dur: '1h00', price: 30 },
          ]},
          { id: 'dp', name: 'Déco personnalisées', children: [
            { id: 'dp-s2', name: 'Simple, 2 doigts', dur: '0h05', price: 6 },
            { id: 'dp-s4', name: 'Simple, 4 doigts', dur: '0h10', price: 12 },
            { id: 'dp-s6', name: 'Simple, 6 doigts', dur: '0h15', price: 18 },
            { id: 'dp-smains', name: 'Simple, mains complètes', dur: '0h20', price: 21 },
            { id: 'dp-c2', name: 'Complexe, 2 doigts', dur: '0h10', price: 8 },
            { id: 'dp-c4', name: 'Complexe, 4 doigts', dur: '0h20', price: 16 },
            { id: 'dp-c6', name: 'Complexe, 6 doigts', dur: '0h40', price: 24 },
            { id: 'dp-cmains', name: 'Complexe, mains complètes', dur: '0h50', price: 28 },
          ]},
          { id: 'bb', name: 'Babyboomer / babycolor / cutiglitters', children: [
            { id: 'bb-2', name: '2 doigts', dur: '0h10', price: 7 },
            { id: 'bb-4', name: '4 doigts', dur: '0h20', price: 14 },
            { id: 'bb-6', name: '6 doigts', dur: '0h30', price: 21 },
            { id: 'bb-mains', name: 'Mains complètes', dur: '0h40', price: 25 },
          ]},
          { id: 'inc', name: 'Incrustations complètes', children: [
            { id: 'inc-2', name: '2 doigts', dur: '0h10', price: 6 },
            { id: 'inc-4', name: '4 doigts', dur: '0h20', price: 12 },
            { id: 'inc-6', name: '6 doigts', dur: '0h30', price: 18 },
            { id: 'inc-mains', name: 'Mains complètes', dur: '0h40', price: 21 },
          ]},
          { id: 'relief', name: 'Déco en relief', children: [
            { id: 'relief-2', name: '2 doigts', dur: '0h10', price: 8 },
            { id: 'relief-4', name: '4 doigts', dur: '0h20', price: 16 },
            { id: 'relief-6', name: '6 doigts', dur: '0h30', price: 24 },
            { id: 'relief-mains', name: 'Mains complètes', dur: '0h40', price: 28 },
          ]},
          { id: 'stickers', name: 'Stickers faits mains', children: [
            { id: 'stk-2', name: '2 doigts', dur: '0h05', price: 14 },
            { id: 'stk-4', name: '4 doigts', dur: '0h10', price: 22 },
            { id: 'stk-6', name: '6 doigts', dur: '0h15', price: 30 },
            { id: 'stk-mains', name: 'Mains complètes', dur: '0h20', price: 38 },
          ]},
        ]},
      ]},
      { id: 'casse', name: 'En cas de casse', children: [
        { id: 'casse-1', name: 'Réparation ongle cassé, 1ère semaine', dur: '0h15', price: 0 },
        { id: 'casse-2', name: 'Réparation à partir de la 2e semaine, hors remplissage', dur: '0h15', price: 4 },
        { id: 'casse-3', name: 'Réparation ongle cassé pendant le remplissage', dur: '0h15', price: 2 },
      ]},
      { id: 'deposes', name: 'Les déposes', children: [
        { id: 'dep-travail', name: 'Dépose complète de mon travail', dur: '0h30', price: 20 },
        { id: 'dep-autre', name: 'Dépose complète autre professionnelle', dur: '0h30', price: 25 },
        { id: 'dep-autre-repose', name: 'Dépose autre professionnelle avec repose', dur: '0h30', price: 10 },
        { id: 'dep-semi', name: 'Dépose vernis semi-permanent', dur: '0h20', price: 12 },
        { id: 'dep-rattrapage', name: 'Rattrapage autre professionnelle', dur: '0h30', price: 8 },
      ]},
      { id: 'press', name: 'Press on nails', children: [
        { id: 'press-kit', name: 'Kit complet + prise de mesure (1er rdv)', dur: '0h30', price: 30 },
        { id: 'press-kit-seul', name: 'Kit press on uniquement', dur: '0h30', price: 25 },
      ]},
    ],
  };

  // Vignettes des familles et sous-familles (assets/prestations/). Le titre est dessiné sur l'image.
  const IMG = {
    'gel': 'assets/prestations/gel.jpg',
    'capsule': 'assets/prestations/capsule.jpg',
    'americaine': 'assets/prestations/americaine.jpg',
    'popits': 'assets/prestations/popits.jpg',
    'semi': 'assets/prestations/semi.jpg',
    'deco': 'assets/prestations/deco.jpg',
    'deco-simple': 'assets/prestations/deco-simple.jpg',
    'deco-elab': 'assets/prestations/deco-elab.jpg',
    'fc': 'assets/prestations/fc.jpg',
    'fo': 'assets/prestations/fo.jpg',
    'fr': 'assets/prestations/fr.jpg',
    'dp': 'assets/prestations/dp.jpg',
    'bb': 'assets/prestations/bb.jpg',
    'inc': 'assets/prestations/inc.jpg',
    'relief': 'assets/prestations/relief.jpg',
    'stickers': 'assets/prestations/stickers.jpg',
    'casse': 'assets/prestations/casse.jpg',
    'deposes': 'assets/prestations/deposes.jpg',
    'press': 'assets/prestations/press.jpg',
  };
  (function attach(n) {
    if (n.children && IMG[n.id]) n.img = IMG[n.id];
    (n.children || []).forEach(attach);
  })(TREE);

  function fmtDur(d) {
    if (!d) return '';
    const m = d.match(/^(\d+)h(\d{2})$/);
    if (!m) return d;
    const h = +m[1], mi = +m[2];
    if (!h) return mi + ' min';
    return mi ? h + ' h ' + String(mi).padStart(2, '0') : h + ' h';
  }
  function fmtPrice(p) { if (p === 0) return 'offert'; return p == null ? 'prix à confirmer' : p + ' €'; }
  function fmtLine(p) { return [fmtDur(p.dur), fmtPrice(p.price)].join(' · '); }

  // Liste à plat des prestations (utilisée aussi par la page réservation).
  const FLAT = {};
  (function walk(node, path) {
    (node.children || []).forEach(child => {
      const p = path.concat(child.name);
      if (child.children) walk(child, p);
      else FLAT[child.id] = { id: child.id, name: child.name, path: p.join(' › '), dur: child.dur, price: child.price };
    });
  })(TREE, []);
  window.BR_PRESTATIONS = FLAT;
  window.BR_FORMAT = { fmtDur, fmtPrice, fmtLine };

  const root = document.getElementById('skull');
  if (!root) return;
  const body = document.getElementById('sk-body');
  const crumbs = document.getElementById('sk-crumbs');
  const back = document.getElementById('sk-back');
  const validate = document.getElementById('sk-validate');
  const choice = document.getElementById('sk-choice');

  let stack = [TREE];
  let selected = null;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render() {
    const node = stack[stack.length - 1];

    crumbs.replaceChildren();
    stack.forEach((n, i) => {
      if (i > 0) crumbs.append(el('span', 'sk-sep', '›'));
      if (i < stack.length - 1) {
        const b = el('button', 'sk-crumb', n.name);
        b.type = 'button';
        b.addEventListener('click', () => { stack = stack.slice(0, i + 1); selected = null; render(); });
        crumbs.append(b);
      } else {
        crumbs.append(el('span', 'sk-current', n.name));
      }
    });

    body.replaceChildren();
    (node.children || []).filter(c => c.children).forEach(c => {
      const b = el('button', 'sk-tile' + (c.img ? ' has-img' : ' sk-tile-plain'));
      b.type = 'button';
      if (c.img) {
        const img = el('img');
        img.src = c.img;
        img.alt = '';
        img.loading = 'lazy';
        b.append(img);
      }
      b.append(el('span', 'sk-tile-label', c.name));
      b.addEventListener('click', () => { stack.push(c); selected = null; render(); });
      body.append(b);
    });
    (node.children || []).filter(c => !c.children).forEach(c => {
      const b = el('button', 'sk-leaf');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(selected === c.id));
      b.append(el('span', 'sk-leaf-name', c.name), el('span', 'sk-leaf-meta', fmtLine(c)));
      b.addEventListener('click', () => { selected = c.id; render(); });
      body.append(b);
    });

    back.disabled = stack.length < 2;
    const sel = selected && FLAT[selected];
    choice.textContent = sel
      ? 'Votre choix : ' + sel.path + ' · ' + fmtLine(sel)
      : 'Choisissez une prestation pour continuer.';
    validate.disabled = !sel;
  }

  back.addEventListener('click', () => {
    if (stack.length > 1) { stack.pop(); selected = null; render(); }
  });
  validate.addEventListener('click', () => {
    if (selected) location.href = 'reservation.html?prestation=' + encodeURIComponent(selected);
  });

  render();
})();
