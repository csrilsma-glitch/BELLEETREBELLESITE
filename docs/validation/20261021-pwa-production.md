# Manager PWA production du 21 octobre 2026

Base production 068bf0715834f57af7fb020e5b9eb68c1966176b. Correctif limité aux fichiers du Manager et aux tests. Aucun mot de passe réinitialisé, facteur MFA supprimé, donnée cliente modifiée ou notification déclenchée.

## Modifications
- Contrôles œil accessibles sur connexion, nouveau mot de passe et confirmation, masqués par défaut. Même page pour navigateur et PWA. Autofill username/current-password/new-password conservé.
- Masquage à la soumission, reset, passage en arrière-plan et fermeture de page. Aucun stockage de valeur.
- Bouton de soumission de récupération distingué des nouveaux boutons œil.
- Métadonnées Apple et icône de lancement ajoutées au Manager. Manifeste stable id/scope/start_url /manager/, standalone ; icônes PNG vérifiées 192 et 512 px.
- Worker br-manager-v15-6 : réseau d’abord, rafraîchissement du shell public, fallback hors ligne, suppression des anciens caches Manager uniquement. Aucune API, POST, requête avec query ni page de récupération interceptée.
- Vérification de mise à jour au retour à l’application et au retour réseau, updateViaCache none. Bouton pour charger la nouvelle version sans rechargement forcé des formulaires.
- Message hors connexion, sans file automatique d’actions privées. Session expirée/révoquée ramène à la connexion avec message explicite. Mauvais identifiants restent refusés sans affaiblissement Auth.

## Vérifications
115 tests Node réussis, suite SQL réussie, 35 fichiers JS valides, 64 prestations conservées. Les nouveaux tests couvrent chaque champ, le maintien des valeurs, le masquage en arrière-plan, l’exclusion des tokens/API de cache, le fallback réseau et la suppression sélective des anciens caches.

Test navigateur local Manager tenté : impossible, Chromium absent au chemin Playwright. Aucun succès Android/iPhone physique revendiqué. Contrôles cloud après déploiement à consigner dans le compte rendu.

Lecture seule production : compte belleetrebelle.flers@outlook.com actif, un facteur MFA vérifié, un calendrier sélectionné, last_sync 2026-10-21 19:20:16 UTC et aucune erreur Outlook à cet instant. Pas d’accès aux jetons, pas de nouvelle écriture Outlook. Des tests d’édition de vrais prix, notes ou rendez-vous n’ont pas été réalisés pour cette intervention.

## Mise à jour et retour en état sûr
L’application installée récupère le nouveau worker lors d’une ouverture en ligne. Le bouton Charger la mise à jour propose un rechargement après enregistrement. À défaut, fermer puis rouvrir l’application connectée ; aucune désinstallation requise. Premier saut depuis une ancienne version peut nécessiter une seconde ouverture.

Retour arrière par correctif Git rétablissant les seuls fichiers modifiés, avec un nouveau numéro de cache supérieur ; ne pas rétablir un ancien worker de façon à conserver indéfiniment son cache. Ne jamais toucher aux données métier pour annuler un correctif visuel.

Validation physique indispensable : sur le téléphone de Mélanie, ouvrir le Manager officiel installé, constater le nouveau bouton œil et l’ouverture autonome. Sur iPhone, installation via Safari puis Partager et Sur l’écran d’accueil. Les autorisations personnelles et codes sont saisis uniquement par Mélanie.
