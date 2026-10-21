# Autorisation et préparation du lancement V15 — 21 octobre 2026

Autorisation explicite de l'utilisateur reçue pour le domaine officiel, les migrations, les réglages et le déploiement. La préproduction reste distincte. Aucun rendez-vous réel n'est modifié pendant la préparation.

## Sauvegarde et conservation

Ancien site : main 050c867a7550701b54bd7f104cff802a95456a24, Netlify 6ad52cedfa980dd29a0e1c59. Copie Git conservée sous backup/production-pre-v15-20261021, commit 789942f71c4257bbd009e63d5e2fa48449b31600. La branche est un checkpoint, pas un retour autorisé vers SimplyBook.

Snapshot privé des tables/fonctions concernées enregistré avant toute écriture en production : public-before-v15.json, 137084 octets, SHA256 e5d34be07ffbc594d5219dae24a5e359b38a313a31639181d6c3cb0c4a31dfe1. Ce snapshot ciblé contient schéma, fonctions, contraintes, droits et données du catalogue/horaires/réglages/Manager ; il n'est pas présenté comme une sauvegarde intégrale des mots de passe Supabase Auth. Les identités et mots de passe existants ne sont pas réécrits.

Les anciennes et nouvelles tables clientes/rendez-vous étaient vides ; aucune indisponibilité, OAuth, tâche ou mapping existant à migrer. 64 prestations et cinq journées d'horaires déjà présentes et conservées, contrôlées par comparaison de toutes les valeurs avant/après.

## Base et réglages réels

Projet production mlbfnlidlvsqghcijuhw. Migrations enregistrées 20261021182148_v15_production_release et 20261021182259_restrict_rls_auto_enable_rpc. Mise à niveau atomique basée sur les 12 migrations testées ; catalogue en insert-on-conflict-do-nothing, pas d'écrasement des prix existants. RLS conservées ; aucune RPC br15 accessible à anon ; nouvelle table des pauses privée. L'ancienne fonction de déclenchement rls_auto_enable n'est plus exposée aux appels publics ; son déclenchement automatique n'est pas supprimé.

Réservations natives activées dans les réglages et variable du contexte de déploiement officiel, mais outlook_required=true : aucune réservation n'est acceptée tant que le calendrier réel n'est pas connecté et synchronisé. E-mails de confirmation/gestion et rappels 24 h activés ; SMS confirmation activés ; SMS rappel restent optionnels et désactivés conformément au réglage initial. Aucun test d'envoi cliente réalisé.

URL Supabase et SITE_URL officiels vérifiés ; clés sensibles existantes préservées sans afficher leurs valeurs. Redirection Microsoft officielle présente. Domaine Resend belleetrebelle-nailstudio.fr verified, sending enabled, région eu-west-1 ; suivi ouverture/clic désactivé. Valeurs de test non importées en production.

## Outlook

Production : aucune connexion OAuth enregistrée au démarrage. Ne pas copier les jetons ni les mappings de test. Mélanie doit autoriser la connexion depuis le Manager officiel et sélectionner Belle & Rebelle — Réservations. Cadence de synchronisation cinq minutes, délai supplémentaire de traitement possible.

Préproduction : suppression de la restriction à un UUID temporaire et de la dépendance à une nouvelle variable Netlify non persistée. Les drapeaux existants sont mis à jour avec leur contexte explicite et relus. Le code choisit/crée exclusivement un calendrier distinct Belle & Rebelle — Préproduction V15, sous identité Outlook désignée ; vérifie nom, caractère non principal et modification autorisée. Refuse la migration implicite de mappings d'événements existants. Verrou de préparation et détection des calendriers homonymes. Les écritures Graph vers un autre calendrier sont refusées. Aucune modification du calendrier professionnel réel par la préproduction. Les notifications de préproduction restent simulées.

## Accès Mélanie

Adresse confirmée par le profil Outlook et l'utilisateur Supabase de production : belleetrebelle.flers@outlook.com. Variante belleetbelle non utilisée. Compte existant actif et confirmé, aucun doublon créé. Au contrôle initial, aucun facteur MFA vérifié en production. L'inscription TOTP reste obligatoire avant l'accès aux données Manager. Mélanie doit choisir/connaître son mot de passe et scanner son QR elle-même. Le compte technique de préproduction est conservé et n'est pas renommé ; aucun compte technique de production existant n'est supprimé.

La récupération existante utilise Supabase Auth et ne supprime pas la MFA. La délivrabilité du lien et la liste des URL de redirection ne sont pas présumées correctes avant contrôle réel.

## Tests et limites

111 tests Node réussis ; tests SQL complets et rappels réussis ; test distinct de mise à niveau d'une base existante réussi avec conservation catalogue, horaires, Manager et réglages. Pas de répétition du cycle réel Outlook déjà validé. Les nouveaux tests ciblent l'isolation des calendriers et les refus en cas de risque.

Avertissement résiduel Auth : contrôle des mots de passe compromis non activé ; aucun coût engagé pour changer de plan. Les réserves juridiques acceptées par l'utilisateur sont conservées, sans faux médiateur ni garantie de purge. Publication des coordonnées expressément autorisée. L'accès personnel MFA et l'OAuth réel sont les étapes de lancement encore indispensables, pas des améliorations secondaires.

## Incident / retour en état sûr

Fermer les réservations via enabled=false et/ou NATIVE_BOOKING_ENABLED=false dans le seul projet officiel, conserver toutes les données et tâches, suspendre les envois si nécessaire et publier un correctif ciblé. Aucun effacement de rendez-vous et aucune réactivation SimplyBook. Restaurer des données uniquement après comparaison avec les nouvelles données éventuellement entrées ; ne jamais remplacer une base en bloc depuis le snapshot.
