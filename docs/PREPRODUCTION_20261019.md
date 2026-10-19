# V15 — Préproduction isolée et validation du 19 octobre 2026

Base de reprise : `v15-claude`, commit `46c4e29c40345b0be9e40eb059a995774bf6116e`, dernier état vérifié. Branche de travail : `dev/v15-work-20261019`.

## Ressources créées

- Supabase : `belleetrebelle-v15-preproduction`, référence `xrpjrweqdhihloykabml`, organisation Belle & Rebelle, région eu-west-1.
- Netlify : `belleetrebelle-v15-preproduction`, ID `b298408f-1d4c-482d-865c-754dbb2f0829`, équipe `belleetrebelle-flers`. Protection par connexion à l'équipe pour tous les déploiements, confirmée à la création.
- Aucune donnée ni clé de production copiée. Les 64 prestations proviennent de la migration catalogue existante. Les 12 tables sont installées dans la base de test avec les migrations 001–004 et le nouveau rappel e-mail.
- Horaires de test : lundi–jeudi 10–19 h, vendredi 10–15 h, week-end fermé ; fuseau Paris. Calendrier natif activé uniquement dans la base de test. Texte clientèle explicitement fictif.
- Variables Netlify de test configurées : `APP_ENV=preproduction`, `EXPECTED_SUPABASE_PROJECT_REF=xrpjrweqdhihloykabml`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NATIVE_BOOKING_ENABLED=true`, `SITE_URL`. Deux secrets aléatoires distincts générés et enregistrés uniquement dans Netlify : `BOOKING_SIGNING_KEY` et `TOKEN_ENCRYPTION_KEY`.
- `.netlify/` et `supabase/.temp/` sont exclus de Git.

## Corrections

- Ajout du rappel e-mail 24 heures avant par migration additive `supabase/migrations/20261019185846_email_reminders.sql` : recalcul après déplacement, invalidation après annulation. SMS toujours désactivés par défaut.
- Un rappel e-mail dépassé n'est plus envoyé, comme pour les rappels SMS.
- En préproduction, l'accès base échoue si son URL ne correspond pas à la référence de test attendue ou si elle désigne le projet de production connu.
- En préproduction, le traitement des jobs et les invocations directes d'envoi sont bloqués : aucun e-mail, SMS ou événement Outlook ne part de ce traitement. Ce mode ne prétend pas simuler une réception fournisseur.
- Aucun changement du prompt, des outils ou de la personnalité de Melba ; aucun retrait SimplyBook ; aucun changement visuel.

## Tests effectivement exécutés

- 29 tests Node passent ; 31 fichiers JavaScript valides ; catalogue de 64 prestations.
- Tests SQL PGlite passent, y compris la nouvelle migration et le rappel e-mail.
- Sur la vraie base Supabase de test : `tests/remote-preproduction.sql` passe. Il vérifie 54 € / 105 minutes pour gel-gainage + déco simple, création, idempotence, lien forgé, déplacement, rappel 24 h, annulation et refus sous 24 h. La transaction est annulée après vérification.
- Deux appels SQL indépendants lancés en parallèle sur le même créneau : un seul succès, l'autre retourne « Créneau indisponible ». La réservation fictive a été annulée et ses jobs mis en état obsolete. Aucune suppression de données. Zéro réservation active ensuite.
- Chromium : PC 1440 px, tablette 820 px, mobile 390 px ; crâne, sélection multiple, réservation, proposition Melba avec confirmation explicite, connexion Manager MFA simulée, 64 prestations et paramètres passent. Aucune erreur JavaScript. Les fournisseurs sont simulés dans ces tests navigateur.
- Les 12 vidéos se chargent et se lisent ; la première est amenée à sa vraie fin de lecture avant de passer à la deuxième. Aucun blocage reproduit dans ce Chromium. Cela ne valide pas Safari ni le téléphone réel ni le cache d'une ancienne PWA.
- Resend : domaine vérifié et envoi autorisé confirmés via le connecteur, sans envoi réel.

## Non terminé — ne pas annoncer prêt à publier

- Nouveau site Netlify encore sans déploiement applicatif : il manque notamment `SUPABASE_SECRET_KEY` du projet de test et la liaison du code au nouveau site. Le connecteur Supabase exposé permet les requêtes et migrations, mais pas la récupération de cette clé ni le réglage Auth.
- Connexion Manager réelle, récupération et MFA personnelle de Mélanie restent à tester. Aucun compte personnel copié dans la base de test.
- Consentement OAuth propre à la V15 non obtenu ; le connecteur Outlook ChatGPT ne l'accorde pas. Aucun événement Outlook réel créé.
- Réception effective Resend et rappel via ordonnanceur Netlify non testés. Aucun crédit SMS consommé.
- La nouvelle migration est appliquée uniquement au projet de test, jamais au projet de production.
- Information clientèle réelle, règles de compatibilité et reprise des futurs rendez-vous SimplyBook restent à valider avant ouverture.
- Aucun DNS, secret de production, table de production, branche main ou publication du site public modifié.

## Suite

Terminer l'accès au tableau de bord Supabase si nécessaire pour configurer l'Auth de test et transférer sa clé serveur vers Netlify sans la publier dans la conversation. Lier la branche de développement au site de préproduction protégé. Tester le parcours HTTP contre cette base isolée. Garder les envois externes bloqués jusqu'à un test fournisseur explicitement limité. Obtenir le consentement Microsoft de Mélanie seulement lorsqu'il sera nécessaire, sur un calendrier de test dédié, puis valider les parcours réels avant toute migration de production.
