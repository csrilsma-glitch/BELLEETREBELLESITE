# Contre-audit indépendant de la PR #3 — Melba, dates, créneaux

**Objet :** PR #3, branche `fix/20261023-melba-creneaux`, commit `a27f935`, base `bb4bf6f` (`main`).
**Auditeur :** Claude, 23 octobre 2026, lecture du code et exécution locale.
**Périmètre :** 28 fichiers, +742 / −35 lignes. Aucune fusion, aucun déploiement, aucune écriture en production.

## Verdict

**PR non prête à être fusionnée.**

Trois anomalies de niveau bloquant sont confirmées par reproduction, et elles touchent exactement les points demandés (abandon, dates, honnêteté des créneaux) :

1. **HTN-ERR-066** — Melba peut affirmer un créneau sans appel de disponibilité : le garde-fou textuel laisse passer « neuf heures », « midi », « votre créneau est bon », « je vous réserve ».
2. **HTN-ERR-067** — Un changement d'avis suivi d'une nouvelle demande (« je change d'avis, plutôt demain matin ») est traité comme un abandon : la nouvelle demande est perdue.
3. **HTN-ERR-068** — Une date mémorisée écrase le changement de jour de semaine : après « demain » puis « plutôt vendredi », les disponibilités sont interrogées pour demain.

Le travail de Work est solide sur la structure : les garde-fous existent, les dates sont résolues en Europe/Paris, le contexte signé est vérifié, les menus natifs remplacent les grilles, les anciennes propositions sont invalidées. Les corrections sont à compléter, pas à refaire.

## Corrections validées

| Correction | Vérification | Mode de preuve |
|---|---|---|
| Date courante Europe/Paris injectée au modèle | Lecture de `chat.js` (`policy.today()`) ; test Node | Code + 158 tests |
| Prochaine occurrence sans année, « demain », « après-demain » | `requestedDate` : demain → 2026-10-24 le 23/10 ; « 5 octobre » → 2027-10-05 | Reproduit (script) |
| Date explicite passée refusée | Garde `guardedReply` : « Cette date est passée » | Reproduit |
| Date invalide (ex. 30 février) refusée | `requestedDate` → null | Reproduit |
| Contexte signé : falsifié ignoré | `core.safeEqual` sur la signature ; contexte absent si signature invalide | Lecture de code |
| Disponibilités interrogées avant toute proposition | `check_availability` appelle `b.availability` ; sans préférence, l'outil demande matin ou après-midi | Lecture + test Node |
| Alternative vérifiée, jamais devinée | Boucle sur `b.availability` pour chaque jour suivant | Reproduit (8 appels) |
| Écriture réelle uniquement après clic | `book_appointment` renvoie `requires_confirmation` ; `reservations.js` non modifié | Lecture de code + diff |
| Pas de fausse annulation | `directReply` renvoie vers le lien sécurisé ; aucun outil d'annulation | Lecture + test |
| Créneaux en menu natif avec groupes Matin / Après-midi | `reservation.js`, `manager.js` : `<select>` | Lecture de code |
| Ancienne proposition désactivée au message suivant | `assistant.js` : `requestSequence` et boutons désactivés | Lecture de code |
| Réponses tardives ignorées | Garde `sequence` côté assistant ; `requestKey` réinitialisé dans `clearSlot` (vérifié) | Lecture de code |
| Gras Markdown retiré, texte toujours sûr | `textContent` conservé ; seuls les `**…**` appariés sont retirés | Lecture de code |
| Aucun diff sur les écritures, migrations, Outlook, MFA | Liste des 28 fichiers vérifiée | Diff |

## Corrections refusées ou à reprendre

| Correction annoncée | Constat | Décision |
|---|---|---|
| M01 — « simulation de réponse inventée neutralisée » | Contournements confirmés : « je vous réserve neuf heures mardi », « il reste une place à midi demain », « votre créneau est bon, je vous attends mardi », « je vous propose une place à neuf heures » passent le garde-fou | **Refusée en l'état** (HTN-ERR-066) |
| M02 — « abandon explicite testé » | La règle d'abandon accepte « je change d'avis, plutôt demain matin » et répond « Pas de souci » : la nouvelle demande est perdue | **Refusée en l'état** (HTN-ERR-067) |
| M03 — « jour calculé, dates testées » | Le jour de semaine seul (« jeudi ») n'est pas résolu ; la date mémorisée écrase la demande | **Refusée en l'état** (HTN-ERR-068) |
| M04 — « préférence conservée » | « 1h30 » de soin devient une préférence « matin » ; l'alternative coûte 8 appels | **À corriger** (HTN-ERR-069, HTN-ERR-070) |

## Anomalies et risques résiduels

| ID | Priorité | Constat | Reproduction |
|---|---|---|---|
| HTN-ERR-066 | Bloquant | Affirmations horaires ou de disponibilité sans outil | `preuves-pr3/adversarial-policy.cjs` |
| HTN-ERR-067 | Bloquant | Abandon court-circuite une demande | `adversarial-policy.cjs`, ligne « abandon + nouvelle demande » |
| HTN-ERR-068 | Bloquant | Date mémorisée écrase le jour demandé | `PR_DIR=… node adversarial-tools.cjs`, cas A |
| HTN-ERR-069 | Moyen | Durée « 1h30 » prise pour une préférence | `adversarial-policy.cjs` |
| HTN-ERR-070 | Moyen | 8 appels de disponibilité pour une demande sans créneau | `adversarial-tools.cjs`, cas B |
| HTN-ERR-073 | Faible | Race UI corrigée par lecture ; non reproduite navigateur | Lecture |

Autres risques, non bloquants :
- Le garde-fou ne s'applique qu'en l'absence de résultat d'outil ; avec résultat, le texte du modèle est remplacé par un texte canonique. C'est le bon choix, mais la sécurité repose sur la regex quand le modèle ne consulte pas le calendrier.
- Le numéro de téléphone de la gérante reste écrit en dur dans `chat.js` et l'assistant. Il est déjà public sur le site ; à centraliser dans la configuration pour les futurs templates.
- `book_appointment` ne vérifie pas que la date du modèle est celle de la cliente : elle est remplacée par la date mémorisée. Cohérent avec HTN-ERR-068, à corriger avec lui.

## Tests effectivement exécutés (23 octobre 2026, environnement Linux, Node 22)

| Commande | Résultat | Remarque |
|---|---|---|
| `npm ci --ignore-scripts` | OK | 0 vulnérabilité signalée |
| `node --test tests/*.test.js` | **158 / 158 réussis** | Tous, dont les tests Melba de Work |
| `node scripts/check.js` | OK, 38 fichiers, 64 prestations | Work annonçait 38 aussi |
| `node tests/sql.test.cjs` | **Tous réussis** | Migrations de la chaîne canonique (PGlite) |
| `node tests/reminders-lifecycle.test.cjs` | **OK** | Rappels 24 h, reprise après crash |
| Scripts adversariaux (`preuves-pr3/`) | **Échecs confirmés** sur HTN-ERR-066 à 069 | Voir tableau ci-dessus |
| `npm run test:browser`, `test:manager`, `test:targeted-ui`, `test:mfa-ui` | **Non exécutés** | Téléchargement de Chromium refusé par le proxy de la session ; sorties de Work fournies dans `preuves-pr3/` mais non reproduites |
| Test PWA et caches navigateur | **Non exécuté** | Idem ; couverture Node partielle uniquement |
| Déploiement, production, appareils physiques | **Non effectués** | Hors périmètre |

Les preuves de Work sont cohérentes avec les tests Node que j'ai relancés. Je ne peux pas confirmer les sorties navigateur, faute de Chromium.

## Cas adversariaux à conserver

Les scripts sont dans `preuves-pr3/` (`adversarial-policy.cjs`, `adversarial-tools.cjs`). Ils s'exécutent avec `PR_DIR=<checkout de la PR>`. Ils ne sont pas encore intégrés à `npm test` : à faire avant fusion.

## Correctifs demandés avant fusion

1. **Abandon** : n'accepter le raccourci que si le message ne contient que la formule d'abandon (aucune date, heure, prestation, « plutôt », « mais », « et », « demain »). Sinon, passer au modèle. (HTN-ERR-067)
2. **Garde-fou sans outil** : lorsqu'aucun résultat d'outil n'est présent, remplacer toute mention d'heure (en chiffres ou en lettres : une à douze heures, midi, minuit), de jour de la semaine lié à un créneau, ou de disponibilité, par la demande de précision. Ajouter les phrases adversariales aux tests. (HTN-ERR-066)
3. **Date** : résoudre les jours de semaine (« jeudi », « lundi prochain ») côté serveur. Ne jamais remplacer la date du modèle par une date mémorisée quand le dernier message en contient une autre. (HTN-ERR-068)
4. **Préférence** : ne prendre « HHhMM » comme heure de début que précédé de « à », « vers », « entre » ou « de », sinon demander. (HTN-ERR-069)
5. **Alternatives** : limiter la recherche à trois jours, et ne lancer la recherche que si la préférence est déjà connue. (HTN-ERR-070)
6. **Tests navigateur** : relancer `test:browser`, `test:manager`, `test:targeted-ui` et `test:mfa-ui` sur une machine disposant de Chromium, et joindre les sorties.

## Nouvelles règles préventives pour AutoDiag

Voir `recommandations-autodiag.md`. Résumé :
- Tout texte produit par un modèle qui affirme une disponibilité, une heure ou une réservation doit être rapproché d'un résultat d'outil ; sinon il est remplacé.
- Un raccourci de conversation ne doit jamais couvrir un message porteur d'une demande.
- La date de référence vient du dernier message, pas d'un état mémorisé.
- Chaque requête a un budget d'appels au calendrier, testé.

## Avis

**PR non fusionnable en l'état.** Après les six correctifs ci-dessus et l'exécution des tests navigateur, elle pourra être réexaminée. Aucune fusion ni déploiement n'a été fait.
