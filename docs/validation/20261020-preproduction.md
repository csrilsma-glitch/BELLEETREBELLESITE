# Validation du 20 octobre 2026 (Europe/Paris)

Base Git : v15-claude, 0ecc64768e4a50b60bc47f3657bb7c1cf36c5e15. Les seules différences de ce commit par rapport à 221e4a1 sont le script WebM et son branchement dans le test navigateur ; aucun correctif applicatif n’était donc absent du déploiement 6ad67b4d5d1c9a3490f09810.

## Tests réels effectués

- Connexion d’équipe Netlify rétablie par le formulaire sécurisé. Protection privée conservée ; aucun contournement ni cookie exporté. La session de périmètre est distincte de la connexion Manager.
- Site déployé : https://belleetrebelle-v15-preproduction.netlify.app/ ; PWA Manager : /manager/.
- Catalogue réel : 64 prestations. Sélection navigateur gel-gainage + deco-simple-unite : 54 EUR, 105 minutes. Créneaux lus depuis les fonctions Netlify et Supabase de test.
- Création via l’interface du rendez-vous fictif 8a87a799-d71a-496a-bf4a-52af78fe7e3c, le 27 octobre 2026 à 10 h Paris (09 h UTC), fin 11 h 45 Paris. Vérification SQL : statut confirme, 2 prestations, 5400 centimes, 105 minutes.
- Rendez-vous ensuite annulé via la RPC de test. La confirmation native window.confirm n’a pas pu être pilotée par l’API de dialogue du navigateur : ne pas annoncer l’annulation cliente via navigateur comme validée. Aucune donnée supprimée.
- Vidéos originales du site déployé : 1, 2 et 3 en lecture effective, compteurs de temps progressant, passage pendant la lecture, pause, précédent et reprise, aucune erreur vidéo. Aucun WebM de substitution utilisé.
- Supabase Auth réel : création administrative d’un compte entièrement fictif avec e-mail confirmé sans message, mot de passe aléatoire conservé seulement en mémoire serveur, login, enrôlement et vérification TOTP, JWT aal2, utilisateur vérifié, présence dans br15_managers, déconnexion globale. Résultats booléens dans 20261020-auth.json.
- Nettoyage Auth : allowlist désactivée, compte fictif bloqué, aucun compte de Mélanie utilisé. Les lignes de test sont conservées, jamais supprimées. Le runner Supabase br15-auth-validation a été remplacé après exécution par un handler inerte HTTP 410 (verify_jwt=true). Son code reproductible est tests/live-auth/index.ts ; il refuse par défaut sans substitution d’un hash de jeton temporaire et d’une expiration. Les secrets Supabase n’ont jamais quitté le serveur.
- Attention : ce test Auth via API Supabase n’est pas une connexion réussie dans l’interface Manager Netlify. Le formulaire réel /manager/ s’affiche, son installation Android et sa connexion complète ne sont pas validées.

## Tests locaux du dernier commit

32 tests Node passent, 31 fichiers JS valides, 64 prestations. Scénarios SQL PGlite et migration email_reminders passent. Chromium PC/tablette/mobile : crâne, sélection, réservation, Manager/MFA simulés et réglages passent. Les 12 MP4 originaux ont été décodés et lus ; fin/rejouer, pause, navigation rapide, source précédente libérée et erreur/réessai passent. Cache PWA : ancien cache supprimé, JS actualisé, aucune vidéo/API en cache. Aucun VIDEO_SHIM_DIR utilisé.

## Correction apportée

La confirmation de réservation affirmait que les notifications étaient en cours alors que APP_ENV=preproduction interdit tout envoi. Les réponses serveur identifient maintenant le mode test ; la page et Melba indiquent explicitement qu’aucun e-mail/SMS n’a été envoyé. Le comportement hors préproduction est conservé.

## Limites et interventions restantes

1. Créer un compte Manager de test durable par le canal Auth administratif, avec mot de passe et TOTP contrôlés par le testeur, puis l’autoriser dans br15_managers. Aucun accès personnel réel nécessaire pour cette recette. Le compte automatique éphémère a été bloqué après usage.
2. Tester la connexion Manager complète sur Netlify, la récupération avec un lien administratif généré sans envoi, et l’installation Android sur un appareil réel. Aucun e-mail de récupération envoyé pendant cette validation.
3. Outlook et fournisseurs : aucune clé de production copiée, aucun consentement personnel ni synchronisation ni réception réelle validés. Les envois restent coupés. Pour un test futur, autorisation distincte et destinataire/calendrier de test nécessaires.
4. Ne pas basculer : SimplyBook futur, information clientèle, paramètres métier et recette finale restent à valider. Aucun changement main, domaine, DNS, site public, base de production ou données clientes réelles.
