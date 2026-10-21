# Essai réel Outlook autorisé — 21 octobre 2026

Préproduction uniquement. Compte vérifié par connecteur : belleetrebelle.flers@outlook.com. Calendrier non principal « Belle & Rebelle — Réservations », identique au calendar_id enregistré dans Supabase TEST.

Déploiement applicatif : 95b843013d915cb82dea7a8d49aeb535df76ed8b, Netlify 6ad883b80de5182bc1712fc2, ready 09:20:14 UTC.

Isolation supplémentaire : OUTLOOK_PREPROD_BLOCK_ID = ba49b590-3130-4396-b7c8-0c5e8043f5ea. Seul ce bloc peut être exporté ; les autres pauses restent différées. Les jobs de rendez-vous Outlook restent simulés tant que cet identifiant est défini. Les e-mails/SMS sont toujours simulés en préproduction.

Pause fictive créée dans la table du Manager (par SQL de test, sans session UI Manager), puis modifications/suppression prévues via les RPC utilisées par le Manager. Libellé : TEST V15 — cycle automatique 21 octobre. Créneau initial : 10 novembre 2026, 11h–12h Europe/Paris (10h–11h UTC). Aucun rendez-vous Supabase ni événement Outlook préexistant dans la fenêtre de test 10h–13h UTC.

L'insertion a généré le job outlook-block, revision 1. Contrôle br15_slots avec prestation fc-2 : aucun créneau chevauchant la pause. Le planificateur de production du projet de TEST (*/5 minutes) est utilisé, sans endpoint de contournement ni affaiblissement Auth.

106 tests Node réussis dont garde d'identifiant unique. Test réel encore en cours ; ne pas lire ce checkpoint comme preuve d'export réussi.

## Création réelle confirmée à 09:25 UTC

Job revision 1 traité sans erreur, synced_revision=1. Connecteur Outlook indépendant : un seul événement [TEST V15], showAs busy, 10h–11h UTC le 10 novembre, organisatrice attendue, aucun participant. Identifiant identique au mapping serveur.

Modification demandée via br15_update_block vers 11h–12h UTC. Contrôle immédiat du moteur : aucun créneau chevauchant la nouvelle pause, ancien créneau de 10h à nouveau disponible. Aucun bloc importé Outlook pour l'événement que nous avons créé. Attente du planificateur pour constater le PATCH réel.

## Écart de configuration détecté et corrigé

Le connecteur Netlify a annoncé l'upsert d'une NOUVELLE variable OUTLOOK_PREPROD_BLOCK_ID mais sa relecture n'a pas retrouvé cette variable. L'ancienne garde était optionnelle : le premier passage à 09:25 a donc aussi créé un événement TEST pour la pause fictive préexistante du 29 octobre 14h–15h UTC. Cela n'a modifié aucun événement Outlook préexistant.

Événement supplémentaire identifié par mapping/provider_id, sujet [TEST V15], horaire et absence de participants ; supprimé par connecteur Outlook. La pause Supabase d'origine est conservée, son mapping remis en attente sans event_id. Aucune autre suppression Outlook.

Commit bd9f7aaa : restriction temporaire qui se ferme à l'identifiant exact de notre fixture même si la nouvelle variable est absente ; jobs Outlook des rendez-vous simulés pendant l'essai. Tests ajustés à cette restriction : 106/106.

## Modification réelle confirmée

Après passage de 09:30 UTC, synced_revision=2, même event_id, un seul événement dans la fenêtre, nouvelles heures 11h–12h UTC. La lecture Graph directe du connecteur et la table de mapping concordent.

Suppression via br15_admin('unblock',...) à 09:31 UTC : pause absente, tombstone révision 3, créneau de 11h UTC à nouveau disponible. Attente de la suppression automatique Graph au passage suivant.

## Résultat final réel

Au passage de 09:35 UTC (11h35 Paris), revision=3, synced_revision=3, event_id=null, tâche sent sans erreur. Contrôle indépendant Outlook : zéro événement dans la fenêtre du test. La fenêtre de l'événement supplémentaire du 29 octobre est également nettoyée. La pause Manager d'origine est conservée ; seule notre fixture a été retirée du Manager. Les traces techniques de file/mapping sont conservées pour audit.

Aucun doublon à la modification : même event_id. Aucun import en boucle pour notre événement. Le nouveau créneau était bloqué avant le PATCH ; les anciens créneaux sont libérés après modification et suppression. Aucune cliente utilisée, aucun SMS/e-mail émis par ces tests. Aucun changement en production. Le planificateur réel a été testé, avec sa cadence de cinq minutes (prévoir un délai supplémentaire de traitement/lecture).

106 tests Node réussis après les corrections. 32 fichiers JS valides, 64 prestations conservées. La création de fixture a été réalisée par SQL sur la table Manager ; modification et suppression par les RPC du Manager. Ne pas qualifier ceci de recette UI authentifiée de Mélanie.

Activation temporaire terminée : OUTLOOK_PREPROD_TEST=false rétabli et relu. Suppression du fallback d'identifiant codé en dur : en préproduction, l'export des pauses exige désormais OUTLOOK_PREPROD_BLOCK_ID correspondant ; absent ou différent => tâche différée sans écriture. Les fonctions de production ne sont pas soumises à cette garde d'essai.

La nouvelle variable n'a pas été retrouvée après les premiers upserts malgré la réponse « succès ». Ne jamais déduire d'une réponse d'écriture que la configuration est opérationnelle : relire et vérifier. L'activation continue sur un calendrier professionnel partagé ne doit pas être générale. Le moteur de synchronisation est fonctionnel ; l'essai réel est terminé et désactivé. Une reprise nécessite un périmètre de test explicitement configuré et vérifié, sans modification des événements réels.
