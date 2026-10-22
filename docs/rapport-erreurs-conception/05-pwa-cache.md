# 05 — PWA et cache

Trois applications installables coexistent sur le même domaine : le site public (périmètre racine), l'application cliente (`/app/`) et le Manager (`/manager/`). Chacune a son manifeste, son périmètre (`scope`) et son service worker. **Aucune réinstallation n'est requise** pour recevoir une nouvelle version, sauf cas documenté ci-dessous.

Règle générale : les fichiers JavaScript, CSS et pages de l'application sont servis en priorité depuis le réseau. Les API, les requêtes avec paramètres, les pages de récupération de mot de passe et les vidéos ne sont **jamais** mises en cache.

## HTN-ERR-019 — Ancien cache servi après mise à jour

- **Symptôme :** après une mise à jour, l'ancienne interface ou un ancien script reste affiché.
- **Cause :** démontrée à l'audit du 19 octobre : anciens caches de la V14 non supprimés ; cache versionné absent.
- **Impact :** comportement incohérent entre les appareils. Gravité moyenne.
- **Détection :** comparer le numéro de cache actif avec le numéro publié ; contrôler la présence d'anciens caches.
- **Réparation :** caches versionnés par application ; suppression des seuls anciens caches de la même application ; JavaScript et CSS prioritaires au réseau ; mise à jour du service worker sans cache HTTP.
- **Prévention :** incrémenter le numéro de cache à chaque publication touchant les fichiers de l'application ; ne supprimer que les caches de l'application concernée.
- **Test :** contrôle navigateur : ancien cache supprimé, script actualisé ; tests de coexistence des workers (22 octobre).
- **Statut :** corrigé ; testé en navigateur simulé. **À surveiller** sur une installation réelle ayant déjà la V14.
- **Traçabilité :** `docs/PREPRODUCTION_20261019.md` ; `docs/validation/20261021-production-go.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-020 — Vidéos ou API mises en cache

- **Symptôme :** une vidéo ou une réponse d'API ancienne pourrait être servie hors ligne ou après mise à jour.
- **Cause :** risque de conception : le cache statique ne distinguait pas les médias et les API. Non observé en production.
- **Impact :** contenu obsolète, données privées potentiellement conservées sur l'appareil. Gravité élevée pour les données.
- **Détection :** inspecter le contenu des caches après navigation ; vérifier qu'aucune requête API ou vidéo n'y figure.
- **Réparation :** exclusion explicite des API, des requêtes POST, des requêtes avec paramètres, des pages de récupération et des médias.
- **Prévention :** liste d'exclusion écrite dans chaque service worker, testée à chaque changement.
- **Test :** contrôle des caches après parcours navigateur (aucune vidéo ni API) ; tests Node sur les règles d'exclusion.
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261020-preproduction.md` ; `docs/validation/20261021-work.md`.

## HTN-ERR-021 — Manifeste servi sans type MIME attendu

- **Symptôme :** l'application ne propose pas l'installation, car le navigateur refuse le manifeste.
- **Cause :** démontrée à la vérification : le manifeste n'était pas servi avec le type `application/manifest+json`.
- **Impact :** installation impossible. Gravité élevée pour l'installation.
- **Détection :** requête HTTP du manifeste : vérifier le code 200 et l'en-tête de type.
- **Réparation :** type MIME explicite pour le manifeste du Manager (20 octobre) puis pour le manifeste client (22 octobre).
- **Prévention :** contrôle HTTP des manifestes dans le test de déploiement.
- **Test :** HTTP 200 et type attendu sur chaque manifeste après publication.
- **Statut :** corrigé ; testé (HTTP) ; installation physique à valider.
- **Traçabilité :** commit `67d20d91` (sur `main`) ; `docs/validation/20261021-production-go.md`.

## HTN-ERR-022 — Périmètres de service workers qui se chevauchent

- **Symptôme :** le service worker du site public pouvait intercepter les pages du Manager, ou l'inverse.
- **Cause :** risque de conception : périmètre racine trop large. Démontré par la règle de coexistence ajoutée le 21 octobre.
- **Impact :** pages du Manager servies depuis un cache public. Gravité élevée pour les données.
- **Détection :** lister les workers enregistrés et leurs périmètres ; vérifier qu'aucun ne couvre les pages de l'autre.
- **Réparation :** le worker racine exclut `/manager/` ; le Manager a son propre worker sur `/manager/` ; l'application cliente est limitée à `/app/`.
- **Prévention :** chaque application installable a un périmètre distinct, déclaré dans le manifeste et testé.
- **Test :** tests de coexistence des workers et des identités de manifeste (22 octobre) ; contrôle dans le même profil de navigateur.
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261021-pwa-install.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-023 — Bouton d'installation silencieux ou masqué trop tôt

- **Symptôme :** le bouton « Installer » ne réagit pas, ou disparaît avant que l'installation ait eu lieu.
- **Cause :** démontrée à l'audit : l'événement d'installation était consommé sans traitement du refus ni des erreurs ; le message d'aide pouvait être écrasé par le statut de connexion. Une variable non initialisée bloquait aussi l'installation tardive dans l'iframe de l'application cliente (22 octobre).
- **Impact :** installation manquée par la gérante et les clientes. Gravité moyenne.
- **Détection :** clic sur le bouton dans un navigateur qui propose l'installation ; test du refus ; contrôle du masquage.
- **Réparation :** logique d'installation indépendante de l'authentification. Invite déclenchée au clic uniquement, consommée une seule fois. Refus et erreurs ouvrent une aide persistante adaptée à la plateforme. Le bouton ne disparaît qu'après confirmation d'installation ou en mode autonome.
- **Prévention :** ne jamais déclencher une invite automatiquement ; toujours prévoir le cas du refus.
- **Test :** tests Node (acceptation, refus, erreur, invite unique, absence d'événement) ; contrôle navigateur sur ordinateur et mobile simulé. **Installation réelle sur Android et iPhone : non réalisée.**
- **Statut :** corrigé ; testé en simulation ; à valider sur appareil.
- **Traçabilité :** `docs/validation/20261021-pwa-install.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-024 — Mise à jour non propagée à une PWA déjà installée

- **Symptôme :** une application installée continue d'afficher l'ancienne version après publication.
- **Cause :** **non confirmée** sur appareil réel. Mécanisme : le service worker installé se met à jour à l'ouverture en ligne ; un premier saut depuis une ancienne version peut demander une seconde ouverture.
- **Impact :** confusion sur la version en service. Gravité faible à moyenne.
- **Détection :** comparer le numéro de cache affiché ou attendu après ouverture de l'application installée.
- **Réparation :** vérification de mise à jour au retour dans l'application et au retour du réseau ; bouton « charger la mise à jour » ; numéro de cache du Manager incrémenté.
- **Prévention :** documenter la procédure de mise à jour pour la cliente et la gérante ; ne jamais désinstaller par défaut.
- **Test :** installer une version antérieure, publier une version supérieure, ouvrir l'application installée deux fois, vérifier le numéro de cache.
- **Statut :** à surveiller (mitigation en place, validation physique absente).
- **Traçabilité :** `docs/validation/20261021-pwa-production.md` (section « Mise à jour et retour en état sûr »).
