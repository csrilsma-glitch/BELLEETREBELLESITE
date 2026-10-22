# 08 — Notifications et services externes

Principe : en **préproduction**, tout e-mail, SMS et événement externe est **simulé** (marqué `preprod-simulated`), y compris pour un test. Un drapeau de test ne doit jamais permettre un envoi réel. Les fournisseurs utilisés : Resend (e-mails), Brevo (SMS), Microsoft Graph (calendrier), Anthropic (agent), Supabase, Netlify.

## HTN-ERR-041 — Envois réels de test en préproduction

- **Symptôme :** quatre envois réels (un e-mail et un SMS vers deux destinataires de test) ont eu lieu pendant la préproduction, le 20 octobre 2026.
- **Cause :** démontrée. Un mécanisme de marquage « réservation réelle » a été ajouté pour des essais volontaires (commits `351bc90` puis `0e8273b`), puis retiré. Les envois ont été lancés par l'opérateur, mais le rapport initial affirmait qu'aucun n'avait eu lieu : affirmation corrigée ensuite.
- **Impact :** messages reçus par des tiers sans préparation ; information erronée dans un rapport. Gravité élevée.
- **Détection :** comparer les envois fournisseurs avec la liste des tests attendus ; relire le rapport après contrôle de la base.
- **Réparation :** suppression du mécanisme (commit `130908a`, 21 octobre) : en préproduction, tout e-mail et tout SMS restent simulés. Vérifié dans le code de `main` : le drapeau n'existe plus dans les fichiers de fonctions.
- **Prévention :** un mode de test ne peut pas autoriser un envoi réel. Les rapports doivent être vérifiés contre la base et les journaux fournisseurs avant publication.
- **Test :** tentative d'envoi en préproduction : statut simulé attendu, aucune requête fournisseur.
- **Statut :** corrigé ; testé. Incident documenté.
- **Traçabilité :** `docs/validation/20261020-preproduction.md` (section « Rappels et fournisseurs », avec correction du 21 octobre) ; `docs/validation/20261021-finalisation.md`.

## HTN-ERR-042 — Message de test atypique non attribué

- **Symptôme :** un e-mail de réservation fictive, daté du 20 octobre, contenait un libellé de test, un identifiant absent de la base de test, et une chaîne de test littérale.
- **Cause :** **non établie.** Le contenu ressemble à un scénario de test, mais ni l'auteur ni le canal d'appel n'ont pu être déterminés avec les métadonnées accessibles. Il n'est pas attribué à un outil ou à une personne.
- **Impact :** traçabilité incomplète ; présence d'une chaîne de test dans un message. Gravité moyenne.
- **Détection :** rapprocher l'envoi du journal de la base et du dépôt. Aucune correspondance trouvée.
- **Réparation :** aucune. Le journal d'envoi actuel ne permet pas d'identifier l'auteur.
- **Prévention :** journal d'envoi horodaté avec origine (fonction, action, environnement) ; aucune chaîne de test dans un gabarit de message ; tous les gabarits relus avant activation.
- **Test :** vérifier que chaque envoi enregistré porte son origine.
- **Statut :** non résolu (traçabilité insuffisante).
- **Traçabilité :** `docs/validation/20261021-finalisation.md` (section « E-mail réel inexpliqué »).

## HTN-ERR-043 — Simulation qui ne prouve pas la réception fournisseur

- **Symptôme :** les tests montrent un envoi « simulé » ; cela ne prouve pas que le message serait reçu.
- **Cause :** conception des tests : la simulation valide la logique, pas la livraison.
- **Impact :** fausse confiance sur la livraison. Gravité moyenne.
- **Détection :** distinguer « accepté par le fournisseur » de « reçu par le destinataire » dans chaque rapport.
- **Réparation :** test de réception limité à un destinataire choisi explicitement, non réalisé.
- **Prévention :** un rapport ne dit jamais « envoyé et reçu » sans preuve de réception.
- **Test :** envoi contrôlé à un destinataire de test, puis vérification de la réception.
- **Statut :** à surveiller (test de réception à réaliser).
- **Traçabilité :** `docs/validation/20261021-finalisation.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-044 — Endpoint SMS de test ouvert vers un numéro libre

- **Symptôme :** un point d'entrée permettait d'envoyer un SMS à un numéro choisi, avec un jeton d'administration.
- **Cause :** démontrée par le script d'origine (audit du 19 octobre) : endpoint de test ouvert à un numéro français quelconque.
- **Impact :** envoi de SMS non contrôlé, coût et atteinte à des tiers. Gravité élevée.
- **Détection :** lecture du code de la fonction ; recherche de l'appel à l'API d'envoi.
- **Réparation :** la fonction du dépôt a été remplacée par un endpoint inerte HTTP 410 (commits `221e4a1` puis `3ec3fd7`). **Constat : le rapport du 19 octobre indiquait que le fichier était inchangé ; il était exact à cette date, mais ne l'est plus.** L'original reste conservé pour référence dans `docs/send-sms-original.js.txt` et ne doit pas être redéployé.
- **Prévention :** aucun endpoint de test d'envoi vers un numéro libre, même protégé ; les SMS passent par les tâches transactionnelles.
- **Test :** requête vers la fonction : réponse 410 attendue.
- **Statut :** corrigé ; vérifié dans le code de `main` (le 23 octobre 2026).
- **Traçabilité :** `docs/send-sms-original.js.txt` (copie de l'original) ; historique du fichier : `050c867` (création), `221e4a1`, `3ec3fd7`.

## HTN-ERR-045 — SMS incertain après interruption

- **Symptôme :** un SMS dont l'envoi n'a pas été confirmé (interruption du traitement) restait en état incertain.
- **Cause :** démontrée : le traitement a été interrompu après l'envoi mais avant la confirmation.
- **Impact :** risque de double envoi si on relance sans vérifier, ou de non-envoi si on ne relance pas. Gravité moyenne.
- **Détection :** tâches en état incertain dans la file ; rapprochement avec le journal fournisseur.
- **Réparation :** rapprochement exact avec le fournisseur (étiquette de tâche), statut corrigé en « envoyé » sans renvoi ; crédit non consommé une seconde fois (22 octobre).
- **Prévention :** état « incertain » distinct de « échec » ; aucune relance sans rapprochement préalable.
- **Test :** simulation d'interruption après envoi, puis rapprochement ; cycle de rappels et reprise après interruption (tests SQL).
- **Statut :** corrigé ; testé ; à surveiller.
- **Traçabilité :** `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-046 — File de notifications saturée en rafale

- **Symptôme :** lors d'une rafale de réservations, les notifications étaient traitées trop lentement.
- **Cause :** démontrée : le traitement ne prenait que quatre tâches par passage.
- **Impact :** retard d'envoi. Gravité faible à moyenne.
- **Détection :** test de rafale ; mesure du nombre de tâches restantes après plusieurs passages.
- **Réparation :** 24 tâches par passage, dans le budget de 18 secondes de la fonction.
- **Prévention :** dimensionner le traitement par passage en fonction du budget de temps, et tester la rafale.
- **Test :** tests de rafale et du cycle des rappels (20 octobre).
- **Statut :** corrigé ; testé.
- **Traçabilité :** commit `686be513` (sur `main`) ; `docs/validation/20261020-evening.md`.

## HTN-ERR-047 — Appel planifié journalisé 499

- **Symptôme :** un appel planifié de traitement a été journalisé avec le code 499 (requête interrompue côté client), alors que le traitement s'est poursuivi en base.
- **Cause :** **non établie.** Aucune autre erreur 5xx dans la fenêtre contrôlée.
- **Impact :** retard possible ou journal trompeur. Gravité faible.
- **Détection :** journaux de la fonction planifiée ; comparer avec l'état de la file.
- **Réparation :** aucune identifiée.
- **Prévention :** journaliser le début et la fin de chaque passage, indépendamment de la réponse HTTP.
- **Test :** surveiller les passages planifiés pendant plusieurs jours.
- **Statut :** à surveiller (cause non confirmée).
- **Traçabilité :** `docs/validation/20261020-preproduction.md` (section « Incidents et limites »).

## HTN-ERR-048 — Ordonnanceur des rappels non testé

- **Symptôme :** les rappels de 24 heures sont validés par simulation, mais l'ordonnanceur réel n'a pas été contrôlé.
- **Cause :** choix de test : aucun envoi réel n'a été autorisé.
- **Impact :** rappel non déclenché en production. Gravité élevée pour la fonctionnalité.
- **Détection :** planifier un rappel de test et vérifier son déclenchement à l'heure prévue.
- **Réparation :** à réaliser après autorisation explicite.
- **Prévention :** tout mécanisme planifié a un test de déclenchement réel dans la checklist de lancement.
- **Test :** rappel de test planifié, déclenchement observé, statut simulé vérifié.
- **Statut :** à surveiller (non testé en situation réelle).
- **Traçabilité :** `docs/ETAT_NUIT_2026-10-19.md` ; `docs/validation/20261021-production-go.md`.
