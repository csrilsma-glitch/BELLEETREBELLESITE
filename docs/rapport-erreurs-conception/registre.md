# Registre des erreurs de conception — vue d'ensemble

Vue synthétique de toutes les entrées `HTN-ERR`. Le détail de chaque entrée est dans le fichier de sa catégorie. Le statut reflète la situation au 23 octobre 2026, d'après les documents lus et les vérifications signalées dans chaque entrée.

Légende : **C** corrigé · **T** testé · **S** à surveiller · **N** non résolu · **D** démontré par preuve · **H** hypothèse ou cause non confirmée · **ND** non-défaut

| ID | Nom | Catégorie | Statut | Commits / sources clés |
|---|---|---|---|---|
| HTN-ERR-001 | Réservation multi-prestations partiellement créée | Réservations | C, T | `050c867`, migration 20261019185534 |
| HTN-ERR-002 | Double réservation concurrente | Réservations | C, T (base de test) — test à deux navigateurs à faire | migration 20261019185534 |
| HTN-ERR-003 | Modification tarifaire et montants antérieurs | Réservations | T (risque non observé) | `tests/sql.test.cjs` |
| HTN-ERR-004 | Chargement limité des fiches clientes | Réservations | S | AUDIT_RECETTE |
| HTN-ERR-005 | Melba sans horaires à jour | IA | C, T (réel) | `770b0cd` |
| HTN-ERR-006 | Melba ne confirme pas l'absence d'acompte | IA | C, T (réel) | `f4c13a4c` |
| HTN-ERR-007 | Fallback local remplaçant l'agent | IA | C (code), T partiel | AUDIT_RECETTE |
| HTN-ERR-008 | Confirmation annonçant un envoi bloqué | IA | C, T | 20261020-preproduction |
| HTN-ERR-009 | Erreurs 503 ponctuelles | IA | S, H | 20261020-preproduction |
| HTN-ERR-010 | Disponibilités proposées sans contrôle (signalement) | IA | H — non vérifié | mission Work |
| HTN-ERR-011 | Date nulle ou sans fuseau acceptée | Dates | C (vérifié dans `core.js`), T | 20261021-work |
| HTN-ERR-012 | Fenêtre mensuelle incomplète en fin de mois | Dates | C, T partiel | PREPRODUCTION_20261019 |
| HTN-ERR-013 | Absences dépendantes du fuseau de l'appareil | Dates | S | MANAGER_INSTALLATION |
| HTN-ERR-014 | Mot de passe sans contrôle d'affichage | Interface | C, T (simulation) | 20261021-pwa-production |
| HTN-ERR-015 | Notes clientes : contenu invalide, confirmation ambiguë | Interface | C, T (simulation) | 20261021-work |
| HTN-ERR-016 | Lecteur vidéo : ressources et erreurs | Interface | C, T (simulation), S (réel) | PREPRODUCTION_20261019 |
| HTN-ERR-017 | Échec vidéo sans décodeur H.264 | Interface | ND (environnement) | ETAT_NUIT_2026-10-19 |
| HTN-ERR-018 | Confirmation native non pilotable par l'outil | Interface | C côté test, T | 20261020-evening |
| HTN-ERR-019 | Ancien cache servi après mise à jour | PWA | C, T (simulation), S (réel) | PREPRODUCTION_20261019 |
| HTN-ERR-020 | Vidéos ou API mises en cache | PWA | C, T (simulation) | 20261021-work |
| HTN-ERR-021 | Manifeste sans type MIME attendu | PWA | C, T (HTTP) | `67d20d91` |
| HTN-ERR-022 | Périmètres de service workers qui se chevauchent | PWA | C, T (simulation) | 20261021-pwa-install |
| HTN-ERR-023 | Bouton d'installation silencieux ou masqué trop tôt | PWA | C, T (simulation), S (réel) | 20261021-pwa-install |
| HTN-ERR-024 | Mise à jour non propagée à une PWA installée | PWA | S, H | 20261021-pwa-production |
| HTN-ERR-025 | Connexion Manager refusée (identifiants) | Authentification | N (connexion personnelle à confirmer) | ETAT_NUIT_2026-10-19 |
| HTN-ERR-026 | Enrôlement MFA sans action explicite | Authentification | C, T (simulation) | 20261022-finalisation-production |
| HTN-ERR-027 | Code MFA sans identité de compte affichée | Authentification | C, T (simulation) | 20261022-finalisation-production |
| HTN-ERR-028 | QR et clé MFA restant affichés | Authentification | C, T (simulation) | 20261022-finalisation-production |
| HTN-ERR-029 | Exception MFA pour deux comptes | Authentification | D — en place, risque accepté, à résorber | `bb4bf6f`, `core.js` |
| HTN-ERR-030 | Runner de test d'authentification exposé | Authentification | C, T | 20261020-auth.json |
| HTN-ERR-031 | Lenteur transitoire de l'authentification | Authentification | S, H | 20261021-finalisation |
| HTN-ERR-032 | Doublons ou boucle d'import Outlook | Calendriers | C, T (réel, calendrier de test) | 20261020-evening |
| HTN-ERR-033 | Bloc supprimé dans Outlook non retiré | Calendriers | C, T (réel, calendrier de test) | 20261020-evening |
| HTN-ERR-034 | Pauses Manager non exportées vers Outlook | Calendriers | N (décision à prendre) | 20261021-pauses-outlook |
| HTN-ERR-035 | Modification directe dans Outlook non répercutée | Calendriers | N (limite connue) | AUDIT_RECETTE |
| HTN-ERR-036 | Délai de synchronisation Outlook (5 min) | Calendriers | S (comportement attendu) | 20261020-evening |
| HTN-ERR-037 | Événement d'essai dans le calendrier de travail | Calendriers | C, T — incident documenté | `95b84301`, `bd9f7aaa` |
| HTN-ERR-038 | Identifiant de test codé en dur | Calendriers | C, vérifié dans le code | recherche du 23 octobre |
| HTN-ERR-039 | Choix de calendrier homonyme ou principal | Calendriers | C, T | 20261021-finalisation |
| HTN-ERR-040 | `outlook_required` différent selon l'environnement | Calendriers | N (décision à prendre) | 20261021-production-go |
| HTN-ERR-041 | Envois réels de test en préproduction | Notifications | C, T — incident documenté | `351bc90`, `0e8273b`, `130908a` |
| HTN-ERR-042 | Message de test atypique non attribué | Notifications | N (traçabilité) | 20261021-finalisation |
| HTN-ERR-043 | Simulation ne prouvant pas la réception | Notifications | S | 20261022-finalisation-production |
| HTN-ERR-044 | Endpoint SMS de test ouvert vers un numéro libre | Notifications | C, vérifié dans le code (410) | `050c867`, `221e4a1`, `3ec3fd7` |
| HTN-ERR-045 | SMS incertain après interruption | Notifications | C, T, S | 20261022-finalisation-production |
| HTN-ERR-046 | File de notifications saturée en rafale | Notifications | C, T | `686be513` |
| HTN-ERR-047 | Appel planifié journalisé 499 | Notifications | S, H | 20261020-preproduction |
| HTN-ERR-048 | Ordonnanceur des rappels non testé | Notifications | S | ETAT_NUIT_2026-10-19 |
| HTN-ERR-049 | Préproduction pointant vers la production | Déploiement | C, T | ETAT_NUIT_2026-10-19, `core.js` |
| HTN-ERR-050 | Variable enregistrée mais absente à la relecture | Déploiement | C (procédure), S | 20261021-outlook-pause-reel |
| HTN-ERR-051 | Contexte « production » Netlify ambigu | Déploiement | S (documentation) | PREPRODUCTION_20261019 |
| HTN-ERR-052 | Liaison du dépôt Netlify bloquée | Déploiement | N (action humaine) | 20261020-preproduction |
| HTN-ERR-053 | Séries de migrations rejouables | Déploiement | C, T | 20261021-migrations |
| HTN-ERR-054 | Migration sans WHERE refusée en contexte API | Déploiement | C, T | `20261021064201` |
| HTN-ERR-055 | Extension dans le schéma public | Déploiement | C (test), à vérifier (production) | `20261021061311`, `20261021182148` |
| HTN-ERR-056 | Tests SQL locaux non fidèles | Déploiement | C, T | 20261021-finalisation |
| HTN-ERR-057 | Rapport de déploiement non concordant | Déploiement | C (processus) | 20261021-work |
| HTN-ERR-058 | Déploiements automatiques pendant les sauvegardes | Déploiement | C (processus) | 20261021-work |
| HTN-ERR-059 | Fonction RLS exécutable par des rôles publics | Sécurité | C, vérifié dans le dépôt | `20261021182259` |
| HTN-ERR-060 | Tables RLS sans politique signalées | Sécurité | ND | 20261021-finalisation |
| HTN-ERR-061 | Protection des mots de passe divulgués désactivée | Sécurité | N (risque accepté) | 20261021-production-go |
| HTN-ERR-062 | Conservation 365 jours sans purge automatique | Sécurité | N | 20261021-consolidation |
| HTN-ERR-063 | Informations juridiques à compléter | Sécurité | N (bloquant public) | 20261021-juridique |
| HTN-ERR-064 | Script tiers injecté par l'hébergeur | Sécurité | S | 20261021-juridique |
| HTN-ERR-065 | Données sensibles dans des rapports | Sécurité | S (règle en place) | 20261021-finalisation |
| HTN-ERR-066 | Affirmation d'heure ou de disponibilité sans consultation | IA | N (partiellement corrigé en `01a9ecd` ; « c'est réservé » non bloqué) | PR #3 `a27f935`, `01a9ecd` |
| HTN-ERR-067 | Changement d'avis avec nouvelle demande traité comme abandon | IA | C dans `01a9ecd`, testé (adversarial) | PR #3 `melba-policy.js` |
| HTN-ERR-068 | Date mémorisée écrasant un changement de jour | Dates | Corrigé dans le code en `01a9ecd`, preuve à refaire (cas A non représentatif) | PR #3 `chat.js` |
| HTN-ERR-069 | Durée prise pour une préférence horaire | IA | N (non corrigé en `01a9ecd` : « un soin de 1h30 » → matin) | PR #3 `melba-policy.js` |
| HTN-ERR-070 | Recherches de disponibilité en cascade | Réservations | N (confirmé, correction à faire) | PR #3 `chat.js` |
| HTN-ERR-071 | Markdown affiché brut | Interface | C dans la PR, à relancer sur navigateur | PR #3 `assistant.js` |
| HTN-ERR-072 | Grille de créneaux démesurée | Interface | C dans la PR, à relancer sur navigateur | PR #3 `reservation.js`, `manager.js` |
| HTN-ERR-073 | Réponse ou proposition tardive actionnable | Interface | C dans la PR (lecture), à relancer | PR #3 `assistant.js` |
| HTN-ERR-074 | Jour de la semaine identique au jour courant résolu à aujourd'hui | Dates | C dans `135e084`, testé | PR #3 `melba-policy.js` (`requestedDate`) |
| HTN-ERR-075 | Prestation nommée non retenue (« kit press nails complet uniquement ») | IA | C dans `17f1c32` (déployé `c0c20e0`), testé ; vérification téléphone à faire | `melba-press-context.test.js` |
| HTN-ERR-076 | Date et heure dans le même message : créneau non reconnu | IA | C dans la branche `fix/20261023-melba-parcours` (`3ba662f`), testé | `melba-parcours.test.js` |
| HTN-ERR-077 | Coordonnées reçues mais aucun récapitulatif (« je dois vérifier le calendrier ») | IA | C dans la branche `fix/20261023-melba-parcours` (`3ba662f`), testé ; défaut reproduit sur `c0c20e0` | `melba-parcours.test.js` |

## Bilan au 23 octobre 2026

- **77 entrées** (065 au 23 octobre, puis 066–074 issues du contre-audit de la PR #3, second contre-audit sur `01a9ecd`, puis 075–077 issues du parcours de réservation sur téléphone).
- **Non résolues** (statut N) : 15 entrées — 025, 034, 035, 040, 042, 052, 061, 062, 063, 066, 068 (preuve à refaire), 069, 070, 074. Parmi elles, 063 bloque un lancement public, 061 est un risque de sécurité accepté, 040 et 034 attendent une décision.
- **Risque en place à résorber** : 029 (exception MFA pour deux comptes), présente sur `main`.
- **À surveiller** (statut S ou H) : 004, 009, 010 (non vérifié), 013, 016, 019, 023, 024, 031, 036, 043, 045, 047, 048, 050, 051, 055 (production), 064, 065.
- **Non-défauts** : 060 (comportement attendu), 017 (environnement de test).
- **Vérifications faites dans le dépôt cloné** (clone superficiel rattrapé pour les commits cités) : 011, 038, 044, 029, 054, 055, 059, 049, 041 (absence du drapeau), 037 (garde).
- **Non revérifiées** : tous les comportements en production et sur appareil physique. Elles restent à contrôler après autorisation.
