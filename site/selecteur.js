// Sélecteur de prestations en forme de crâne (cartes à faire défiler).
// Arborescence : Onglerie (A à F) + Press on nails. Libellés validés par Mélanie.
// Durées et tarifs : fiches SimplyBook. Identifiants SimplyBook : assets/prestations.json.
(function () {
  const TREE = {
 "id": "root",
 "name": "Prestations",
 "children": [
  {
   "id": "onglerie",
   "name": "Onglerie",
   "children": [
    {
     "id": "gel",
     "name": "Prestations Gel",
     "children": [
      {
       "id": "gel-gainage",
       "name": "Gel sans rallongement",
       "dur": "1h30",
       "price": 52
      },
      {
       "id": "gel-chablon",
       "name": "Extension chablon",
       "dur": "2h00",
       "price": 60
      },
      {
       "id": "gel-premiere",
       "name": "Première pose sur ongles rongés",
       "dur": "1h15",
       "price": 55
      },
      {
       "id": "gel-remp-34",
       "name": "Remplissage en 3 et 4 semaines de repousses",
       "dur": "1h30",
       "price": 45
      },
      {
       "id": "gel-remp-5",
       "name": "Remplissage après 5 semaines de repousses",
       "dur": "1h30",
       "price": 49
      }
     ],
     "img": "assets/prestations/gel.jpg"
    },
    {
     "id": "capsule",
     "name": "Prestations Capsules",
     "children": [
      {
       "id": "americaine",
       "name": "Pose américaine",
       "children": [
        {
         "id": "am-courte",
         "name": "Courte ou medium",
         "dur": "1h30",
         "price": 48
        },
        {
         "id": "am-longue",
         "name": "Longue",
         "dur": "1h30",
         "price": 58
        }
       ],
       "img": "assets/prestations/americaine.jpg"
      },
      {
       "id": "popits",
       "name": "Rallongement popits et demi popits",
       "children": [
        {
         "id": "popits-court",
         "name": "Popits court ou medium",
         "dur": "2h00",
         "price": 55
        },
        {
         "id": "popits-long",
         "name": "Popits long",
         "dur": "2h30",
         "price": 63
        },
        {
         "id": "demi-court",
         "name": "Demi popits court ou medium",
         "dur": "2h00",
         "price": 59
        },
        {
         "id": "demi-long",
         "name": "Demi popits long",
         "dur": "2h30",
         "price": 66
        },
        {
         "id": "popits-amande",
         "name": "Popits amandes Russes",
         "dur": "3h00",
         "price": 70
        }
       ],
       "img": "assets/prestations/popits.jpg"
      }
     ],
     "img": "assets/prestations/capsule.jpg"
    },
    {
     "id": "semi",
     "name": "Semi-permanent",
     "children": [
      {
       "id": "semi-main-1",
       "name": "Semi permanent main première pose",
       "dur": "0h45",
       "price": 35
      },
      {
       "id": "semi-main-entretien",
       "name": "Entretien semi permanent mains",
       "dur": "0h45",
       "price": 40
      },
      {
       "id": "semi-pied-1",
       "name": "Semi permanent pied première pose",
       "dur": "0h45",
       "price": 32
      },
      {
       "id": "semi-pied-entretien",
       "name": "Entretien semi permanent pieds",
       "dur": "0h45",
       "price": 36
      }
     ],
     "img": "assets/prestations/semi.jpg"
    },
    {
     "id": "deco",
     "name": "Déco / Nail Arts",
     "children": [
      {
       "id": "deco-simple",
       "name": "Déco simple",
       "children": [
        {
         "id": "deco-simple-unite",
         "name": "Déco très simple à l’unité",
         "dur": "0h15",
         "price": 2
        },
        {
         "id": "deco-simple-mains",
         "name": "Déco très simple forfait mains complètes",
         "dur": "0h30",
         "price": 14
        }
       ],
       "img": "assets/prestations/deco-simple.jpg"
      },
      {
       "id": "deco-elab",
       "name": "Déco élaborée",
       "children": [
        {
         "id": "fc",
         "name": "French classique",
         "children": [
          {
           "id": "fc-2",
           "name": "Deux doigts",
           "dur": "0h05",
           "price": 4
          },
          {
           "id": "fc-4",
           "name": "Quatre doigts",
           "dur": "0h10",
           "price": 8
          },
          {
           "id": "fc-6",
           "name": "Six doigts",
           "dur": "0h20",
           "price": 12
          },
          {
           "id": "fc-mains",
           "name": "Mains complètes",
           "dur": "0h30",
           "price": 14
          }
         ],
         "img": "assets/prestations/fc.jpg"
        },
        {
         "id": "fo",
         "name": "French originale",
         "children": [
          {
           "id": "fo-2",
           "name": "Deux doigts",
           "dur": "0h05",
           "price": 6
          },
          {
           "id": "fo-4",
           "name": "Quatre doigts",
           "dur": "0h10",
           "price": 12
          },
          {
           "id": "fo-6",
           "name": "Six doigts",
           "dur": "0h20",
           "price": 18
          },
          {
           "id": "fo-mains",
           "name": "Mains complètes",
           "dur": "0h30",
           "price": 21
          }
         ],
         "img": "assets/prestations/fo.jpg"
        },
        {
         "id": "fr",
         "name": "French reverse",
         "children": [
          {
           "id": "fr-2",
           "name": "Deux doigts",
           "dur": "0h20",
           "price": 10
          },
          {
           "id": "fr-4",
           "name": "Quatre doigts",
           "dur": "0h30",
           "price": 18
          },
          {
           "id": "fr-6",
           "name": "Six doigts",
           "dur": "0h40",
           "price": 26
          },
          {
           "id": "fr-mains",
           "name": "Mains complètes",
           "dur": "1h00",
           "price": 30
          }
         ],
         "img": "assets/prestations/fr.jpg"
        },
        {
         "id": "dp",
         "name": "Décos personnalisées",
         "children": [
          {
           "id": "dp-simple",
           "name": "Simple",
           "children": [
            {
             "id": "dp-s2",
             "name": "Deux doigts",
             "dur": "0h05",
             "price": 6
            },
            {
             "id": "dp-s4",
             "name": "Quatre doigts",
             "dur": "0h10",
             "price": 12
            },
            {
             "id": "dp-s6",
             "name": "Six doigts",
             "dur": "0h15",
             "price": 18
            },
            {
             "id": "dp-smains",
             "name": "Mains complètes",
             "dur": "0h20",
             "price": 21
            }
           ],
           "img": "assets/prestations/dp-simple.jpg"
          },
          {
           "id": "dp-complexe",
           "name": "Complexe",
           "children": [
            {
             "id": "dp-c2",
             "name": "Deux doigts",
             "dur": "0h10",
             "price": 8
            },
            {
             "id": "dp-c4",
             "name": "Quatre doigts",
             "dur": "0h20",
             "price": 16
            },
            {
             "id": "dp-c6",
             "name": "Six doigts",
             "dur": "0h40",
             "price": 24
            },
            {
             "id": "dp-cmains",
             "name": "Mains complètes",
             "dur": "0h50",
             "price": 28
            }
           ],
           "img": "assets/prestations/dp-complexe.jpg"
          }
         ],
         "img": "assets/prestations/dp.jpg"
        },
        {
         "id": "bb",
         "name": "Babyboomer / babycolor",
         "children": [
          {
           "id": "bb-2",
           "name": "Deux doigts",
           "dur": "0h10",
           "price": 7
          },
          {
           "id": "bb-4",
           "name": "Quatre doigts",
           "dur": "0h20",
           "price": 14
          },
          {
           "id": "bb-6",
           "name": "Six doigts",
           "dur": "0h30",
           "price": 21
          },
          {
           "id": "bb-mains",
           "name": "Mains complètes",
           "dur": "0h40",
           "price": 25
          }
         ],
         "img": "assets/prestations/bb.jpg"
        },
        {
         "id": "inc",
         "name": "Incrustation complète",
         "children": [
          {
           "id": "inc-2",
           "name": "Deux doigts",
           "dur": "0h10",
           "price": 6
          },
          {
           "id": "inc-4",
           "name": "Quatre doigts",
           "dur": "0h20",
           "price": 12
          },
          {
           "id": "inc-6",
           "name": "Six doigts",
           "dur": "0h30",
           "price": 18
          },
          {
           "id": "inc-mains",
           "name": "Mains complètes",
           "dur": "0h40",
           "price": 21
          }
         ],
         "img": "assets/prestations/inc.jpg"
        },
        {
         "id": "relief",
         "name": "Déco relief",
         "children": [
          {
           "id": "relief-2",
           "name": "Deux doigts",
           "dur": "0h10",
           "price": 8
          },
          {
           "id": "relief-4",
           "name": "Quatre doigts",
           "dur": "0h20",
           "price": 16
          },
          {
           "id": "relief-6",
           "name": "Six doigts",
           "dur": "0h30",
           "price": 24
          },
          {
           "id": "relief-mains",
           "name": "Mains complètes",
           "dur": "0h40",
           "price": 28
          }
         ],
         "img": "assets/prestations/relief.jpg"
        },
        {
         "id": "stickers",
         "name": "Stickers faits mains",
         "children": [
          {
           "id": "stk-2",
           "name": "Deux doigts",
           "dur": "0h05",
           "price": 14
          },
          {
           "id": "stk-4",
           "name": "Quatre doigts",
           "dur": "0h10",
           "price": 22
          },
          {
           "id": "stk-6",
           "name": "Six doigts",
           "dur": "0h15",
           "price": 30
          },
          {
           "id": "stk-mains",
           "name": "Mains complètes",
           "dur": "0h20",
           "price": 38
          }
         ],
         "img": "assets/prestations/stickers.jpg"
        }
       ],
       "img": "assets/prestations/deco-elab.jpg"
      }
     ],
     "img": "assets/prestations/deco.jpg"
    },
    {
     "id": "casse",
     "name": "En cas de casse",
     "children": [
      {
       "id": "casse-1",
       "name": "Réparation ongle cassé la 1ère semaine",
       "dur": "0h15",
       "price": 0
      },
      {
       "id": "casse-2",
       "name": "Réparation à partir de la 2ème semaine hors remplissage",
       "dur": "0h15",
       "price": 4
      },
      {
       "id": "casse-3",
       "name": "Réparation ongle cassé pendant le remplissage",
       "dur": "0h15",
       "price": 2
      }
     ],
     "img": "assets/prestations/casse.jpg"
    },
    {
     "id": "deposes",
     "name": "Les déposes",
     "children": [
      {
       "id": "dep-travail",
       "name": "Dépose complète de mon travail",
       "dur": "0h30",
       "price": 20
      },
      {
       "id": "dep-autre",
       "name": "Dépose complète autre professionnelle",
       "dur": "0h30",
       "price": 25
      },
      {
       "id": "dep-autre-repose",
       "name": "Dépose complète autre professionnelle avec repose",
       "dur": "0h30",
       "price": 10
      },
      {
       "id": "dep-semi",
       "name": "Dépose semi permanent",
       "dur": "0h20",
       "price": 12
      },
      {
       "id": "dep-rattrapage",
       "name": "Rattrapage autre professionnelle",
       "dur": "0h30",
       "price": 8
      }
     ],
     "img": "assets/prestations/deposes.jpg"
    }
   ],
   "img": "assets/prestations/onglerie.jpg"
  },
  {
   "id": "press",
   "name": "Press on nails",
   "children": [
    {
     "id": "press-kit",
     "name": "Kit complet + prise de mesure",
     "dur": "0h30",
     "price": 30
    },
    {
     "id": "press-kit-seul",
     "name": "Kit complet uniquement",
     "dur": "0h30",
     "price": 25
    }
   ],
   "img": "assets/prestations/press.jpg"
  }
 ]
};

  function fmtDur(d) {
    if (!d) return '';
    const m = d.match(/^(\d+)h(\d{2})$/);
    if (!m) return d;
    const h = +m[1], mi = +m[2];
    if (!h) return mi + ' min';
    return mi ? h + ' h ' + String(mi).padStart(2, '0') : h + ' h';
  }
  function fmtPrice(p) {
    if (p === 0) return 'offert';
    return p == null ? 'prix à confirmer' : p + ' €';
  }
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
  const stage = document.getElementById('sk-body');
  const crumbs = document.getElementById('sk-crumbs');
  const titleEl = document.getElementById('sk-title');
  const choiceEl = document.getElementById('sk-choice');
  const backBtn = document.getElementById('sk-back');
  const validateBtn = document.getElementById('sk-validate');
  const prevBtn = document.getElementById('sk-prev');
  const nextBtn = document.getElementById('sk-next');

  // Pile des niveaux : chaque niveau garde la carte sélectionnée (index).
  let levels = [{ node: TREE, index: 0 }];
  const top = () => levels[levels.length - 1];
  const items = () => top().node.children || [];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function placeCard(card, d) {
    const scale = d === 0 ? 1 : 0.74;
    card.style.transform = 'translate(-50%, -50%) translateX(' + (d * 74) + '%) scale(' + scale + ')';
    card.style.opacity = d === 0 ? '1' : '0.42';
    card.style.zIndex = d === 0 ? '3' : '1';
  }

  function validateCurrent() {
    const c = items()[top().index];
    if (!c) return;
    if (c.children) {
      levels.push({ node: c, index: 0 });
      render();
    } else {
      location.href = 'reservation.html?prestation=' + encodeURIComponent(c.id);
    }
  }

  function render() {
    const lvl = top();
    const list = items();
    lvl.index = Math.max(0, Math.min(lvl.index, list.length - 1));

    crumbs.replaceChildren();
    levels.forEach((l, i) => {
      if (i > 0) crumbs.append(el('span', 'sk-sep', '›'));
      if (i < levels.length - 1) {
        const b = el('button', 'sk-crumb', l.node.name);
        b.type = 'button';
        b.addEventListener('click', () => { levels = levels.slice(0, i + 1); render(); });
        crumbs.append(b);
      } else {
        crumbs.append(el('span', 'sk-current', l.node.name));
      }
    });

    stage.replaceChildren();
    list.forEach((item, i) => {
      const d = i - lvl.index;
      if (Math.abs(d) > 1) return;
      const card = el('button', 'sk2-card' + (d === 0 ? ' is-center' : ' is-side'));
      card.type = 'button';
      card.setAttribute('aria-label', item.name);
      if (item.children) {
        if (item.img) {
          const img = el('img');
          img.src = item.img;
          img.alt = '';
          img.loading = 'lazy';
          card.append(img);
        } else {
          card.append(el('span', 'sk2-leaf-name', item.name));
        }
        card.append(el('span', 'sk2-card-btn', 'Voir plus'));
      } else {
        card.append(el('span', 'sk2-leaf-name', item.name));
        card.append(el('span', 'sk2-leaf-meta', fmtLine(item)));
        card.append(el('span', 'sk2-card-btn', 'Choisir'));
      }
      placeCard(card, d);
      card.addEventListener('click', () => {
        if (d === 0) validateCurrent();
        else { lvl.index = i; render(); }
      });
      stage.append(card);
    });

    const c = list[lvl.index];
    titleEl.textContent = levels.length === 1 ? 'Que souhaitez-vous ?' : lvl.node.name;
    choiceEl.textContent = !c ? '' : c.children
      ? 'Faites défiler, puis validez pour voir : ' + c.name
      : 'Votre choix : ' + c.name + ' · ' + fmtLine(c);
    backBtn.disabled = levels.length < 2;
    prevBtn.disabled = lvl.index <= 0;
    nextBtn.disabled = lvl.index >= list.length - 1;
  }

  backBtn.addEventListener('click', () => { if (levels.length > 1) { levels.pop(); render(); } });
  validateBtn.addEventListener('click', validateCurrent);
  prevBtn.addEventListener('click', () => { top().index--; render(); });
  nextBtn.addEventListener('click', () => { top().index++; render(); });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { top().index--; render(); }
    if (e.key === 'ArrowRight') { top().index++; render(); }
  });

  render();
})();
