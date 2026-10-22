# 09 — Déploiement et configuration

Règle : la préproduction et la production sont deux projets Supabase et deux sites Netlify distincts. Toute variable de configuration est **relue après écriture**. Les déploiements automatiques sont désactivés pendant les sauvegardes par les marqueurs `[skip ci]` et `[skip netlify]`.

## HTN-ERR-049 — Préproduction pointant vers la base de production

- **Symptôme :** un aperçu de déploiement utiliserait les mêmes données et les mêmes clés que le site en ligne.
- **Cause :** démontrée à l'audit du 19 octobre : les aperçus partageaient le projet et les clés de production.
- **Impact :** écriture ou envoi sur des données clientes réelles depuis un environnement de test. Gravité très élevée.
- **Détection :** comparer la référence du projet Supabase configurée avec la référence attendue.
- **Réparation :** projet Supabase de test isolé ; garde qui refuse de démarrer si la référence attendue ne correspond pas ou si l'URL désigne la production ; secrets distincts générés pour le projet de test.
- **Prévention :** référence attendue par environnement, contrôlée au démarrage ; aucune clé de production copiée dans un environnement de test.
- **Test :** comparaison booléenne des variables (aucune valeur affichée), contrôle de la référence, et accès refusé si l'URL ne correspond pas.
- **Statut :** corrigé ; testé (contrôle de configuration du 20 octobre, confirmé le 21 octobre).
- **Traçabilité :** `docs/ETAT_NUIT_2026-10-19.md` ; `docs/PREPRODUCTION_20261019.md` ; `netlify/functions/lib/core.js` (garde `EXPECTED_SUPABASE_PROJECT_REF`, vérifiée présente).

## HTN-ERR-050 — Variable annoncée enregistrée mais absente à la relecture

- **Symptôme :** l'outil de configuration répond « succès » à l'ajout d'une variable, mais la variable n'existe pas à la relecture.
- **Cause :** démontrée le 21 octobre. La réponse d'écriture ne reflétait pas l'état réel. Cette erreur a conduit à l'incident HTN-ERR-037.
- **Impact :** configuration supposée active alors qu'elle ne l'est pas. Gravité élevée.
- **Détection :** relire la configuration après chaque écriture et comparer avec la valeur attendue.
- **Réparation :** procédure : écrire, relire, comparer. Une variable absente est considérée comme non configurée.
- **Prévention :** la garde qui dépend d'une variable doit échouer fermée si la variable est absente.
- **Test :** relecture de la configuration après écriture ; test de garde sans variable.
- **Statut :** corrigé (procédure et garde) ; à surveiller.
- **Traçabilité :** `docs/validation/20261021-outlook-pause-reel.md` (section « Écart de configuration détecté et corrigé »).

## HTN-ERR-051 — Contexte « production » Netlify ambigu

- **Symptôme :** la configuration du site de préproduction désigne le contexte « production » de Netlify, qui correspond ici à l'URL principale du projet de test, pas au site public.
- **Cause :** convention de nommage de l'hébergeur, source de confusion.
- **Impact :** erreur de manipulation possible lors d'une modification de variable. Gravité moyenne.
- **Détection :** vérifier, pour chaque variable, le projet visé avant écriture.
- **Réparation :** documentation des contextes (en place dans les rapports) ; aucune modification technique.
- **Prévention :** documenter pour chaque site le nom du projet, son identifiant et son URL dans la checklist d'installation.
- **Test :** revue de la configuration avant chaque écriture.
- **Statut :** à surveiller (documentation).
- **Traçabilité :** `docs/PREPRODUCTION_20261019.md` ; `docs/ETAT_NUIT_2026-10-19.md`.

## HTN-ERR-052 — Liaison du dépôt Netlify bloquée

- **Symptôme :** la liaison du dépôt au site de préproduction ne peut pas être finalisée depuis le navigateur ; une restriction de sécurité de la session s'affiche.
- **Cause :** restriction de sécurité de l'environnement de travail, non un défaut du site. Les rapports de travail excluent tout contournement de cette restriction.
- **Impact :** aucun déploiement de la branche de travail sur le site isolé. Gravité moyenne pour les essais.
- **Détection :** tentative de liaison, message de restriction.
- **Réparation :** aucune contournement. Demander une action humaine ou une voie autorisée.
- **Prévention :** prévoir dans la checklist de lancement la liaison du dépôt et la vérification du site par un opérateur.
- **Test :** vérifier, après liaison, que le déploiement correspond au commit attendu.
- **Statut :** non résolu (décision et action humaines requises).
- **Traçabilité :** `docs/PREPRODUCTION_20261019.md` ; `docs/validation/20261020-preproduction.md`.

## HTN-ERR-053 — Séries de migrations pouvant être rejouées

- **Symptôme :** deux séries de fichiers de migration (archives 001 à 004 et fichiers horodatés) pouvaient être exécutées ensemble, avec un risque de double application.
- **Cause :** démontrée par la structure du dépôt du 19 octobre.
- **Impact :** erreur de schéma ou de données. Gravité élevée.
- **Détection :** lister les migrations et leur ordre ; comparer avec l'historique réel de la base.
- **Réparation :** chaîne canonique unique, établie par la concordance du 21 octobre ; les fichiers 001 à 004 sont des archives qui ne doivent pas être exécutés en plus.
- **Prévention :** une seule chaîne de migrations par projet, documentée ; aucun `db push` en production sans comparaison préalable.
- **Test :** exécution de la chaîne canonique sur une base vide ; vérification que le schéma est identique à la base de test.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `docs/validation/20261021-migrations.md` ; `supabase/migrations/` ; `supabase/production/`.

## HTN-ERR-054 — Migration sans clause WHERE refusée en contexte API

- **Symptôme :** la sauvegarde des horaires échoue avec une erreur indiquant qu'une suppression sans condition est refusée.
- **Cause :** démontrée (21 octobre) : la protection de mise à jour sans clause WHERE est active dans le contexte API, mais pas dans les essais SQL directs.
- **Impact :** les horaires ne peuvent pas être enregistrés depuis le Manager. Gravité élevée pour la fonction.
- **Détection :** tester la sauvegarde depuis l'interface, pas seulement en SQL direct.
- **Réparation :** clause `WHERE id IS NOT NULL` dans la suppression de l'ancien jeu de plages, dans la même transaction que l'insertion (migration `20261021064201`, vérifiée dans le dépôt).
- **Prévention :** tester toute fonction par le même chemin que l'application (appel de fonction ou API), pas seulement en SQL direct.
- **Test :** sauvegarde réelle des horaires depuis le Manager ; relecture des cinq plages et des 64 prestations.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `supabase/migrations/20261021064201_admin_hours_safe_update_compatible.sql` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-055 — Extension placée dans le schéma public

- **Symptôme :** le conseiller de sécurité signale une extension installée dans le schéma public.
- **Cause :** démontrée par l'alerte du conseiller et la configuration initiale.
- **Impact :** exposition inutile et avertissement de sécurité. Gravité faible à moyenne.
- **Détection :** conseiller de sécurité ; requête sur le schéma de l'extension.
- **Réparation :** migration déplaçant l'extension vers le schéma `extensions`. Corrigé sur la base de test le 21 octobre (alerte disparue). Le fichier de production contient la même opération, conditionnée à l'emplacement actuel de l'extension (vérifié dans le dépôt).
- **Prévention :** créer les extensions dans le schéma dédié dès la conception ; vérifier les dépendances de la contrainte d'exclusion avant tout déplacement.
- **Test :** conseiller de sécurité après migration ; test SQL de la contrainte d'exclusion.
- **Statut :** corrigé sur test ; **production : à vérifier** dans le conseiller de sécurité après publication.
- **Traçabilité :** `supabase/migrations/20261021061311_move_btree_gist_to_extensions.sql` ; `supabase/production/20261021182148_v15_production_release.sql`.

## HTN-ERR-056 — Tests SQL locaux non fidèles au schéma Supabase

- **Symptôme :** les tests SQL locaux réussissent, alors que la base réelle a un schéma `extensions` que l'environnement local ne reproduisait pas.
- **Cause :** démontrée le 21 octobre : l'environnement de test local n'émulait pas le schéma `extensions`.
- **Impact :** faux sentiment de sécurité des tests. Gravité moyenne.
- **Détection :** comparer les extensions et schémas de la base de test avec ceux de l'environnement local.
- **Réparation :** émulation du schéma `extensions` dans l'environnement de test, et test fonctionnel supplémentaire de sauvegarde des horaires et pauses.
- **Prévention :** l'environnement local doit reproduire les schémas et extensions du fournisseur ; tout écart est documenté.
- **Test :** suite SQL complète sur l'environnement local après émulation.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `docs/validation/20261021-finalisation.md` (section « Migration finale et tests SQL »).

## HTN-ERR-057 — Rapport de déploiement non concordant avec Netlify

- **Symptôme :** un rapport affirmait « aucun déploiement » alors qu'un déploiement existait déjà, prêt, sur le site de préproduction.
- **Cause :** démontrée (21 octobre) : le rapport reprenait un relais non vérifié.
- **Impact :** décisions prises sur une information fausse. Gravité moyenne.
- **Détection :** vérifier l'état réel des déploiements avant d'écrire dans un rapport.
- **Réparation :** correction dans le contrôle du 21 octobre, avec identifiant et date du déploiement observé.
- **Prévention :** tout rapport de déploiement cite l'identifiant du déploiement, son commit et son statut, relus à la source.
- **Test :** comparer la liste des déploiements avec le rapport avant publication.
- **Statut :** corrigé (processus).
- **Traçabilité :** `docs/validation/20261021-work.md` (section « Références vérifiées »).

## HTN-ERR-058 — Déploiements automatiques pendant les sauvegardes

- **Symptôme :** chaque sauvegarde Git de travail déclenchait un déploiement non voulu.
- **Cause :** comportement par défaut de l'hébergeur à chaque commit.
- **Impact :** déploiements non planifiés, bruit dans les journaux. Gravité faible.
- **Détection :** observer les déploiements après chaque poussée.
- **Réparation :** marqueurs `[skip ci]` et `[skip netlify]` sur les sauvegardes sans changement de production ; déploiements de préproduction seulement quand ils sont voulus.
- **Prévention :** nommer explicitement dans chaque commit s'il doit déclencher un déploiement ; autorisation préalable pour tout déploiement de production.
- **Test :** vérifier, après une sauvegarde, l'absence de nouveau déploiement.
- **Statut :** corrigé (procédé en place).
- **Traçabilité :** `docs/validation/20261021-work.md` ; `docs/validation/20261021-consolidation-en-cours.md`.
