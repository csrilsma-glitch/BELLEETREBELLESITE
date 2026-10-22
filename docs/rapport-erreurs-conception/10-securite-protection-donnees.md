# 10 — Sécurité et protection des données

Principes : les tables sont protégées par RLS ; aucune politique publique n'est ajoutée pour faire disparaître un avertissement. Les données clientes ne sont accessibles qu'au serveur et au Manager authentifié. Aucun secret n'apparaît dans les rapports.

## HTN-ERR-059 — Fonction RLS exécutable par des rôles publics

- **Symptôme :** une fonction d'activation automatique de la protection RLS pouvait être appelée par des utilisateurs non authentifiés.
- **Cause :** démontrée par le conseiller de sécurité du 19 octobre.
- **Impact :** modification non autorisée du schéma de protection. Gravité élevée.
- **Détection :** conseiller de sécurité ; test d'appel avec le rôle anonyme.
- **Réparation :** révocation de l'exécution pour les rôles public, anonyme et authentifié (migration de production `20261021182259`, vérifiée dans le dépôt).
- **Prévention :** toute fonction `SECURITY DEFINER` est révoquée par défaut et réautorisée au seul rôle serveur.
- **Test :** appel anonyme refusé ; conseiller de sécurité après publication.
- **Statut :** corrigé ; vérifié dans le dépôt ; contrôle en production à reconfirmer au conseiller.
- **Traçabilité :** `supabase/production/20261021182259_restrict_rls_auto_enable_rpc.sql` ; `docs/validation/20261021-production-go.md`.

## HTN-ERR-060 — Tables sans politique RLS signalées (non-défaut)

- **Symptôme :** le conseiller signale des tables protégées par RLS sans politique d'accès.
- **Cause :** **comportement attendu.** Ces tables ne sont accessibles qu'au serveur, qui utilise un rôle privilégié.
- **Impact :** aucun pour les visiteurs. Gravité : information.
- **Détection :** conseiller de sécurité, niveau information.
- **Réparation :** aucune. **Ne pas ajouter de politique publique pour supprimer l'avertissement**, car cela ouvrirait les données.
- **Prévention :** documenter pour chaque table son mode d'accès attendu (serveur seul, lecture publique, etc.).
- **Test :** vérifier que le rôle anonyme et le rôle authentifié n'ont aucun droit de table ni d'exécution sur les fonctions de l'application.
- **Statut :** non-défaut.
- **Traçabilité :** `docs/validation/20261021-finalisation.md` (section « Sécurité Supabase ») ; `docs/validation/20261021-consolidation-en-cours.md`.

## HTN-ERR-061 — Protection des mots de passe divulgués désactivée

- **Symptôme :** le conseiller signale que la vérification des mots de passe divulgués n'est pas activée.
- **Cause :** fonctionnalité réservée à une formule payante du fournisseur ; aucune souscription engagée.
- **Impact :** un mot de passe déjà divulgué pourrait être accepté. Gravité moyenne.
- **Détection :** conseiller de sécurité, réglage d'authentification.
- **Réparation :** non réalisée. **Risque accepté** par le propriétaire pour la préparation, sans changement des identifiants existants.
- **Prévention :** compléter la checklist de lancement par la décision explicite sur cette protection et, le cas échéant, son coût.
- **Test :** vérifier le réglage au conseiller après toute évolution de formule.
- **Statut :** non résolu (risque accepté).
- **Traçabilité :** `docs/validation/20261021-finalisation.md` ; `docs/validation/20261021-production-go.md`.

## HTN-ERR-062 — Conservation de 365 jours sans purge automatique

- **Symptôme :** le paramètre de conservation de 365 jours est affiché, mais aucune purge automatique n'est exécutée.
- **Cause :** démontrée : le paramètre existe, mais aucun traitement ne l'applique.
- **Impact :** fausse promesse de conservation dans l'information aux clientes. Gravité élevée pour la conformité.
- **Détection :** rechercher l'utilisation du paramètre dans le code ; vérifier l'existence d'un traitement de purge.
- **Réparation :** non réalisée. Décision à prendre : durée réelle, point de départ, procédure de revue ou d'effacement.
- **Prévention :** tout paramètre de conservation doit être lié à un traitement vérifié, ou désigné comme indicatif.
- **Test :** créer des données de test vieillies, vérifier la purge (une fois la règle décidée).
- **Statut :** non résolu.
- **Traçabilité :** `docs/validation/20261021-consolidation-en-cours.md` ; `docs/validation/20261021-juridique-finalisation.md`.

## HTN-ERR-063 — Informations juridiques à compléter

- **Symptôme :** plusieurs points des mentions légales, de la politique de confidentialité et des conditions de réservation restent à compléter ou à valider.
- **Cause :** informations non fournies ou non vérifiables à ce stade : médiateur de la consommation non désigné, régime de TVA non vérifié, droit de rétractation à qualifier, téléphone de l'hébergeur non trouvé dans les sources officielles.
- **Impact :** conformité incomplète ; **bloquant pour un lancement public.** Gravité élevée.
- **Détection :** checklist juridique, relue à chaque publication des pages.
- **Réparation :** en cours : pages publiées en brouillon, marquées non indexées, avec réserves explicites. Aucune information inventée.
- **Prévention :** chaque mention d'identité, de médiation, de TVA ou de conservation doit renvoyer à une source officielle datée et à une validation de la responsable.
- **Test :** contrôle du contenu des pages (identité, TVA conditionnelle, réserve de médiation) et de leur accessibilité (HTTP 200, sans débordement horizontal).
- **Statut :** non résolu (points listés dans `docs/validation/20261021-juridique-finalisation.md`).
- **Traçabilité :** `docs/validation/20261021-juridique-finalisation.md` ; `docs/validation/20261021-consolidation-en-cours.md`.

## HTN-ERR-064 — Script tiers injecté par l'hébergeur

- **Symptôme :** le site charge un script de badge de l'hébergeur, dans une fenêtre intégrée, qui écrit une préférence dans le stockage local du navigateur.
- **Cause :** injection par la plateforme d'hébergement. Aucun outil publicitaire ou de mesure identifié dans le code applicatif. **L'absence de traceur dans le dépôt ne prouve pas l'absence de traitement chez l'hébergeur.**
- **Impact :** information des visiteurs sur les traceurs, conformité. Gravité moyenne.
- **Détection :** inspecter le DOM réel de la page publique et le contenu du script chargé.
- **Réparation :** politique de cookies complétée par cet inventaire ; aucun bandeau ajouté sans traceur non essentiel identifié.
- **Prévention :** inventorier chaque script injecté par l'hébergeur à la mise en ligne ; vérifier les réglages de la plateforme.
- **Test :** contrôle du DOM et du script après chaque publication.
- **Statut :** à surveiller (contrôle final des traceurs à faire au déploiement).
- **Traçabilité :** `docs/validation/20261021-juridique-finalisation.md` (section « Validation technique » et « Preuves après déploiement »).

## HTN-ERR-065 — Données sensibles dans des rapports ou jetons de test littéraux

- **Symptôme :** un message de test contenait une chaîne de type jeton, et des rapports auraient pu contenir des identifiants de réservation réels ou des valeurs de configuration.
- **Cause :** démontrée : gabarits de test non nettoyés ; rapports rédigés avec des données brutes.
- **Impact :** exposition de données ou de secrets de test. Gravité moyenne.
- **Détection :** recherche de motifs (jetons, identifiants, adresses) dans les rapports et les gabarits avant publication ; scanner de secrets de l'hébergeur (aucun secret détecté au déploiement du 22 octobre).
- **Réparation :** rapports sans valeurs sensibles ; chaînes de test retirées des gabarits.
- **Prévention :** règle d'écriture : les rapports citent des identifiants masqués et des comptes par rôle, jamais des valeurs. Revue avant tout commit de documentation.
- **Test :** recherche automatisée de motifs dans `docs/` avant publication.
- **Statut :** à surveiller (règle en place, contrôle automatisé à créer).
- **Traçabilité :** `docs/validation/20261021-finalisation.md` ; `docs/validation/20261022-finalisation-production.md`.
