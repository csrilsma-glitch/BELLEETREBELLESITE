# V15 — Préproduction isolée et validation du 19 octobre 2026

Base de reprise : `v15-claude`, commit `46c4e29c40345b0be9e40eb059a995774bf6116e`, dernier état vérifié. Branche de travail : `dev/v15-work-20261019`.

## Ressources créées

- Supabase : `belleetrebelle-v15-preproduction`, référence `xrpjrweqdhihloykabml`, organisation Belle & Rebelle, région eu-west-1.
- Netlify : `belleetrebelle-v15-preproduction`, ID `b298408f-1d4c-482d-865c-754dbb2f0829`, équipe `belleetrebelle-flers`. Protection par connexion à l'équipe pour tous les déploiements, confirmée à la création.
- Aucune donnée ni clé de production copiée. Les 64 prestations proviennent de la migration catalogue existante. Les 12 tables sont installées dans la base de test avec les migrations 001–004 et le nouveau rappel e-mail.
- Horaires de test : lundi–jeudi 10–19 h, vendredi 10–15 h, week-end fermé ; fuseau Paris. Calendrier natif activé uniquement dans la base de test. Texte clientèle explicitement fictif.
- Variables Netlify de test configurées : `APP_ENV=preproduction`, `EXPECTED_SUPABASE_PROJECT_REF=xrpjrweqdhihloykabml`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NATIVE_BOOKING_ENABLED=true`, `SITE_URL`. Deux secrets aléatoires distincts générés pour le projet de test : `BOOKING_SIGNING_KEY` et `TOKEN_ENCRYPTION_KEY`.
- `.netlify/` et `supabase/.temp/` sont exclus de Git.

## Corrections

- Ajout du rappel e-mail 24 heures avant par migration additive `supabase/migrations/20261019185846_email_reminders.sql` : recalcul après déplacement, invalidation après annulation. SMS toujours désactivés par défaut.
- Un rappel e-mail dépassé n'est plus envoyé, comme pour les rappels SMS.
- En préproduction, l'accès base échoue si son URL ne correspond pas à la référence de test attendue ou si elle désigne le projet de production connu.
- En préproduction, le traitement des jobs et les invocations directes d'envoi sont bloqués : aucun e-mail, SMS ou événement Outlook ne part de ce traitement. Ce mode ne prétend pas simuler une réception fournisseur.
- Lecteur galerie : renouvellement de l’élément vidéo et libération de la source précédente, boutons lecture/pause/rejouer, erreur/réessai, navigation rapide ; coordination de la musique par événement délégué.
- Cache PWA versionné à nouveau : JavaScript/CSS prioritaires au réseau, suppression des anciens caches V14, mise à jour du service worker sans cache HTTP. Vidéos toujours exclues.
- Manager : fenêtre de chargement couvrant tout le mois même depuis sa fin ; historique par fiche cliente ajouté, sans limite au mois courant.
- Verrou de base de test appliqué également aux requêtes Auth.
- Aucun changement du prompt, des outils ou de la personnalité de Melba ; aucun retrait SimplyBook ; identité visuelle conservée.

## Tests effectivement exécutés

- 31 tests Node passent ; 31 fichiers JavaScript valides ; catalogue de 64 prestations.
- Tests SQL PGlite passent, y compris la nouvelle migration et le rappel e-mail.
- Sur la vraie base Supabase de test : `tests/remote-preproduction.sql` passe. Il vérifie 54 € / 105 minutes pour gel-gainage + déco simple, création, idempotence, lien forgé, déplacement, rappel 24 h, annulation et refus sous 24 h. La transaction est annulée après vérification.
- Deux appels SQL indépendants lancés en parallèle sur le même créneau : un seul succès, l'autre retourne « Créneau indisponible ». La réservation fictive a été annulée et ses jobs mis en état obsolete. Aucune suppression de données. Zéro réservation active ensuite.
- Chromium : PC 1440 px, tablette 820 px, mobile 390 px ; crâne, sélection multiple, réservation, proposition Melba avec confirmation explicite, connexion Manager MFA simulée, 64 prestations et paramètres passent. Aucune erreur JavaScript. Les fournisseurs sont simulés dans ces tests navigateur.
- Les 12 vidéos se chargent et se lisent ; la première est amenée à sa vraie fin de lecture avant de passer à la deuxième. Aucun blocage reproduit dans ce Chromium. Cela ne valide pas Safari ni le téléphone réel ni le cache d'une ancienne PWA.
- Resend : domaine vérifié et envoi autorisé confirmés via le connecteur, sans envoi réel.

## Non terminé — ne pas annoncer prêt à publier

- Nouveau site Netlify encore sans déploiement applicatif : la liaison du dépôt au nouveau site reste bloquée dans le navigateur. `SUPABASE_SECRET_KEY` est maintenant présente et protégée ; sa valeur masquée ne permet pas de vérifier ses droits avant un appel serveur déployé. Le connecteur Supabase ne permet pas le réglage Auth.
- Connexion Manager réelle, récupération et MFA personnelle de Mélanie restent à tester. Aucun compte personnel copié dans la base de test.
- Consentement OAuth propre à la V15 non obtenu ; le connecteur Outlook ChatGPT ne l'accorde pas. Aucun événement Outlook réel créé.
- Réception effective Resend et rappel via ordonnanceur Netlify non testés. Aucun crédit SMS consommé.
- La nouvelle migration est appliquée uniquement au projet de test, jamais au projet de production.
- Information clientèle réelle, règles de compatibilité et reprise des futurs rendez-vous SimplyBook restent à valider avant ouverture.
- Aucun DNS, secret de production, table de production, branche main ou publication du site public modifié.

## Suite

Terminer l'accès au tableau de bord Supabase si nécessaire pour configurer l'Auth de test et transférer sa clé serveur vers Netlify sans la publier dans la conversation. Lier la branche de développement au site de préproduction protégé. Tester le parcours HTTP contre cette base isolée. Garder les envois externes bloqués jusqu'à un test fournisseur explicitement limité. Obtenir le consentement Microsoft de Mélanie seulement lorsqu'il sera nécessaire, sur un calendrier de test dédié, puis valider les parcours réels avant toute migration de production.

## Point de reprise — 19 octobre 2026, après 22 h (Paris)

Vérification en lecture seule par le connecteur Netlify : neuf variables présentes. `APP_ENV`, référence et URL Supabase, URL du site et activation native ont les valeurs de test attendues. `SUPABASE_SECRET_KEY`, `BOOKING_SIGNING_KEY`, `TOKEN_ENCRYPTION_KEY` ont `is_secret=true`, scope functions inclus et valeurs présentes pour production/branch-deploy/deploy-preview du projet **isolé**. Le contexte appelé « production » par Netlify désigne ici seulement l’URL principale de ce projet de préproduction. Aucune valeur secrète n’a été affichée. Aucun secret de production transféré.

Ne pas régénérer ces secrets à la reprise. Ne pas confondre présence/masquage avec validation cryptographique ou accès effectif de la clé serveur : ces derniers restent à tester côté serveur.

Le navigateur confirme la connexion au compte Netlify et la liste du dépôt autorisé. Cependant la sélection du dépôt déclenche `credential_observation_restricted` ; la récupération autorisée par navigation ne conserve pas le formulaire de liaison. Ne pas boucler sur cette procédure ni contourner cette protection. Le connecteur Netlify disponible ne propose pas d’action de liaison de dépôt ou de lancement de build. Aucun build applicatif lancé pendant cette reprise, aucun agent Netlify payant lancé.

Blocages regroupés pour le retour de Cyril :
1. Achever la liaison du dépôt dans le projet de préproduction, branche `dev/v15-work-20261019`, publish `site`, functions `netlify/functions`, base et commande vides ; les variables sont désormais enregistrées séparément et ne sont plus à ressaisir. Le premier déploiement est autorisé uniquement sur ce projet isolé. Vérifier la protection équipe sur tous les déploiements.
2. Vérifier les endpoints déployés contre la base de test, puis créer un compte de test Manager par le canal administratif approprié et tester Auth/récupération/MFA. L’enrôlement personnel de Mélanie reste à sa charge.
3. Préparer le consentement Microsoft propre au site et un calendrier de test ; aucun accès Outlook autonome n’est encore validé.
4. Le mode de préproduction bloque les envois externes. Un test de réception Resend limité nécessite un destinataire de test explicitement choisi ; les SMS restent désactivés et aucun crédit consommé.
5. Vérifier les futurs rendez-vous SimplyBook et la migration avant toute bascule publique.

Le site public, `main`, les DNS et les données de production restent inchangés. Ne pas annoncer une PWA utilisable ni fournir une URL comme fonctionnelle tant que le déploiement et l’authentification réelle ne sont pas validés.
