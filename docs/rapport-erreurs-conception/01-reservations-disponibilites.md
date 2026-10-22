# 01 — Réservations et disponibilités

## HTN-ERR-001 — Réservation multi-prestations partiellement créée

- **Symptôme :** une réservation de plusieurs prestations pourrait être enregistrée en partie seulement (une prestation créée, l'autre non), avec durée et prix faux.
- **Cause :** démontrée par lecture de code. L'ancien flux appelait le service de réservation externe prestation par prestation, sans transaction ni compensation. Risque identifié à l'audit du 19 octobre 2026 ; aucune occurrence observée en production native.
- **Impact :** réservations incohérentes, facturation et durée fausses. Gravité élevée. Fonctionnalité : réservation multiple.
- **Détection :** test de cumul sur une, deux et trois prestations ; contrôle des totaux (minutes, centimes) et du nombre de lignes en base après chaque tentative.
- **Réparation :** moteur natif unique avec une fonction transactionnelle qui crée toutes les prestations ou aucune. Les anciens endpoints ont été retirés (archive du 21 octobre).
- **Prévention :** toute création multi-lignes se fait dans une seule transaction côté base. Aucun appel externe successif sans compensation.
- **Test :** tests SQL (cumul durée/prix, par exemple 52 € / 90 min, 54 € / 105 min, 58 € / 110 min) ; tests HTTP sur une, deux et trois prestations, 20 octobre 2026.
- **Statut :** corrigé ; testé sur base de test et environnement de préproduction. Ancien service : obsolète, sans reprise de rendez-vous (décision du propriétaire du 21 octobre).
- **Traçabilité :** `supabase/migrations/20261019185534_v15_schema.sql` ; `docs/PREPRODUCTION_20261019.md` ; `docs/validation/20261020-preproduction.md`. Historique de l'ancien script : `050c867`.

## HTN-ERR-002 — Double réservation sur un même créneau

- **Symptôme :** deux clientes peuvent obtenir le même créneau si elles réservent presque en même temps.
- **Cause :** démontrée par absence de verrou dans le flux initial (audit du 19 octobre). Le risque concerne toute écriture concurrente sur la même plage.
- **Impact :** deux rendez-vous pour un même créneau, gravité élevée.
- **Détection :** deux requêtes parallèles sur le même créneau ; contrôle du nombre de réservations actives sur la plage après les deux appels.
- **Réparation :** verrou transactionnel commun aux réservations, déplacements, pauses, horaires et Outlook ; contrainte d'exclusion sur la plage horaire ; idempotence par clé de requête (un double clic avec la même clé renvoie le même rendez-vous).
- **Prévention :** toute nouvelle opération qui modifie un créneau passe par la même fonction et le même verrou. Interdiction d'écrire directement dans la table des réservations.
- **Test :** deux appels SQL simultanés sur le même créneau : un seul succès, l'autre « Créneau indisponible » (20 octobre) ; deux requêtes HTTP : 201 puis 409 (21 octobre) ; double clic avec la même clé : même identifiant (19 octobre).
- **Statut :** corrigé ; testé sur base de test. **À faire avant ouverture :** test à deux navigateurs sur une base réelle isolée, non réalisé à ce jour.
- **Traçabilité :** `supabase/migrations/20261019185534_v15_schema.sql` ; `docs/validation/20261020-evening.md` ; `docs/validation/20261021-finalisation.md`.

## HTN-ERR-003 — Modification tarifaire et montants des rendez-vous antérieurs

- **Symptôme :** après une modification de prix dans le Manager, un rendez-vous déjà enregistré pourrait afficher un montant différent.
- **Cause :** non observée. Risque de conception : un montant recalculé à la lecture serait modifié par un changement de catalogue.
- **Impact :** facturation et confiance cliente. Gravité moyenne.
- **Détection :** empreinte (hash) de tous les montants et prestations des rendez-vous, comparée avant et après une modification tarifaire.
- **Réparation :** montants figés au moment de la réservation (en centimes) ; aucune recalcul rétroactif.
- **Prévention :** conserver le devis figé dans la réservation. Toute modification de catalogue est suivie d'une comparaison d'empreinte.
- **Test :** test SQL de régression (modification via la fonction d'administration, puis contrôle que le rendez-vous antérieur garde son montant après déplacement). Validation réelle du 21 octobre : une prestation passée de 52,00 à 53,25 €, réservation fictive à 53,25 €, puis catalogue rétabli ; empreinte identique avant et après.
- **Statut :** testé (risque non observé ; comportement correct vérifié).
- **Traçabilité :** `docs/validation/20261021-tarifs-manager.md` ; tests `tests/sql.test.cjs`.

## HTN-ERR-004 — Chargement limité des fiches clientes

- **Symptôme :** au-delà de 1 000 fiches, certaines fiches anciennes ne sont pas visibles dans le Manager.
- **Cause :** démontrée par lecture du code. Le Manager charge les 1 000 fiches les plus récentes, sans pagination.
- **Impact :** Manager, gravité moyenne à long terme ; faible à court terme vu le volume actuel.
- **Détection :** compter les fiches en base ; rechercher une fiche ancienne depuis le Manager.
- **Réparation :** non réalisée.
- **Prévention :** prévoir dès la conception une pagination ou une recherche côté serveur dans les futurs templates.
- **Test :** insérer plus de 1 000 fiches fictives en base de test, puis vérifier la recherche et la pagination.
- **Statut :** à surveiller (non résolu, faible volume actuel).
- **Traçabilité :** `docs/AUDIT_RECETTE.md` (constat du 19 octobre 2026).
