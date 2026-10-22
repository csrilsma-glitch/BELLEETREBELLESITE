# Second contre-audit — PR #3, commit `01a9ecd`

**Date :** 23 octobre 2026
**Périmètre :** correctifs HTN-ERR-066 à 070 ajoutés par Work sur `fix/20261023-melba-creneaux` (commit `01a9ecd`, au-dessus de `a27f935`, base `bb4bf6f`). Diff de 21 fichiers, dont `netlify/functions/chat.js`, `netlify/functions/lib/melba-policy.js` et `tests/melba-counteraudit.test.js`.
**Méthode :** worktree isolé sur `01a9ecd` ; aucune modification de la PR ; aucun merge ; aucun déploiement ; production non touchée.

## Verdict

**Défavorable. Ne pas fusionner, ne pas demander de validation de déploiement.**

- HTN-ERR-069 (durée prise pour une préférence horaire) **n'est pas corrigé** : « un soin de 1h30 » produit une préférence « matin ».
- Une nouvelle anomalie (HTN-ERR-074) : un jour de la semaine identique au jour courant est résolu à aujourd'hui.
- HTN-ERR-066 est **partiellement** corrigé : les six phrases adversariales sont bloquées, mais « C'est réservé pour vous » ne l'est pas.
- HTN-ERR-068 est corrigé dans le code, mais la preuve de Work ne passe pas par le chemin réel du gestionnaire HTTP.

Work doit corriger les points 1 à 3 ci-dessous, puis une nouvelle version sera contrôlée.

## Résultats par anomalie

| ID | Statut après 01a9ecd | Constat |
|---|---|---|
| HTN-ERR-066 | Partiel | Garde-fou : « neuf heures mardi », « midi demain », « votre créneau est bon », « je vous attends », « vous êtes inscrite », « c'est fait, enregistré » → bloqués. **Non bloqué :** « C'est réservé pour vous. », « Parfait, c'est noté, à bientôt ! ». |
| HTN-ERR-067 | Corrigé | « je change d'avis, plutôt demain matin » → transmis au modèle (null). « Non merci, je change d'avis » → abandon. |
| HTN-ERR-068 | Corrigé dans le code, preuve insuffisante | `toolDate` et `dateSource` ajoutés. Le script `adversarial-tools.cjs` (cas A) n'initialise pas `dateSource` : il ne teste pas le chemin réel. Voir HTN-ERR-074 pour le jour courant. |
| HTN-ERR-069 | **Non corrigé** | « 1h30 de soin » seul → null (correct). **« un soin de 1h30 » → morning**, « je voudrais un soin de 1h30 pour mardi » → morning, « soin de 2h, de 10h à 12h » → morning (la durée est lue comme `de 2h`). La règle « de HHhMM » attrape la durée. |
| HTN-ERR-070 | Corrigé | Budget partagé de 4 appels calendrier par requête, 3 jours alternatifs maximum. Script : 4 appels fournisseur (au lieu de 8). Pas de rafale. |
| HTN-ERR-074 (nouveau) | Confirmé, non corrigé | `requestedDate(['vendredi'])` un vendredi → aujourd'hui (23/10). `demain` puis `plutôt vendredi` un vendredi → 23/10 (le serveur impose la date du jour alors que la cliente vise probablement vendredi prochain). |

## Tests exécutés (23 octobre 2026, worktree `01a9ecd`)

| Suite | Résultat |
|---|---|
| `node --test tests/*.test.js` | **168/168 réussis** |
| `node tests/sql.test.cjs` | Tous les tests SQL passent (PGlite) |
| `node tests/reminders-lifecycle.test.cjs` | OK |
| `node scripts/check.js` | 38 fichiers JS valides, 64 prestations conservées |
| `tests/targeted-ui.cjs` (820 et 1440 px) | OK : 96 créneaux en select, clavier, invalidation, texte sûr |
| `tests/manager-ui.cjs` | OK |
| `tests/mfa-ui.cjs` | OK : connexion par mot de passe seul pour les deux comptes autorisés |
| `tests/browser.cjs` | **OK** (site, Manager, PWA, vidéos) — avec un shim WebM, voir ci-dessous |
| `tests/recovery-browser.cjs` | OK : 9 parcours, fonctions simulées |
| `preuves-pr3/adversarial-policy.cjs` | 6 garde-fous bloqués ; 069 non corrigé (voir ci-dessus) |
| `preuves-pr3/adversarial-tools.cjs` | Cas A non représentatif (voir HTN-ERR-068) ; cas B : 4 appels |

**Environnement et limites :**
- Chromium préinstallé (`/opt/pw-browsers/chromium-1194`) utilisé via `BROWSER_EXECUTABLE`. Les suites navigateur ont donc été exécutées réellement.
- Le Chromium de l'environnement ne décode pas le H.264 (HTN-ERR-017). Pour `browser.cjs`, j'ai généré 12 shims WebM (`VIDEO_SHIM_DIR`) à partir des MP4 du dépôt. Le test valide la logique de lecture, pas le décodage H.264 original.
- Pas de test sur appareil physique. Pas de test de production. Pas d'appel réel à Outlook, Resend ou Brevo : les fournisseurs sont simulés par les tests.

## Corrections demandées à Work

1. **HTN-ERR-069** : ne lire une durée comme préférence que si elle est précédée de « à », « vers », « entre » ou « de » **et** qu'aucun mot de durée (« soin », « prestation », « durée », « pose », « travail ») n'apparaît dans la même expression. Ajouter les tests : « un soin de 1h30 » → null ; « un soin de 1h30 le matin » → morning ; « à 10h » → morning ; « vers 15h » → afternoon.
2. **HTN-ERR-066** : ajouter au garde-fou « c'est réservé », « c'est bon pour vous », « c'est noté » (sans résultat d'outil, ces formules sont bloquées), et ajouter les phrases correspondantes aux tests.
3. **HTN-ERR-074** : un jour de la semaine égal au jour courant doit être résolu vers la semaine suivante, ou demander une confirmation. Test : « vendredi » un vendredi → pas aujourd'hui.
4. **HTN-ERR-068** : réécrire le cas A de `adversarial-tools.cjs` pour qu'il initialise `dateSource` et `requestedDate` comme le fait le gestionnaire HTTP (« demain » puis « vendredi »). Le test doit échouer sur la version précédente et réussir sur la nouvelle.
5. **Garde-fou sur-bloquant (suivi, non bloquant)** : « Le soin dure 1 heure » et « Vous pouvez prendre place » sont bloqués. Le comportement existait déjà ; il peut être conservé mais doit être documenté.

## Recommandations AutoDiag

- Une préférence horaire ne se déduit jamais d'une durée : tester toute extraction d'heure contre une liste de mots de durée.
- Tester chaque jour de la semaine **le jour même de ce jour de la semaine**.
- Un test adversarial doit initialiser les mêmes variables de contexte que le gestionnaire HTTP ; un test d'outil isolé ne prouve pas le chemin réel.

## Verdict final

**Défavorable.** Un correctif 069 et un correctif 074 sont nécessaires avant toute nouvelle demande de validation. Aucune validation de déploiement n'est demandée.
