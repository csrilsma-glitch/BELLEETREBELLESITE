# 02 — Intelligence artificielle conversationnelle

Les corrections de cette catégorie ont été faites **sans modifier le prompt d'origine, la personnalité ou les outils de l'agent**. Toute correction passe par le contexte serveur (données lues depuis la base) et par la conception de l'interface.

## HTN-ERR-005 — Melba sans horaires à jour

- **Symptôme :** l'agent répond « horaires non à jour » ou annonce des horaires qui ne correspondent pas au Manager.
- **Cause :** démontrée par une réponse réelle reproduite le 21 octobre. Le contexte serveur transmettait le catalogue et la politique de paiement, mais pas les heures d'ouverture.
- **Impact :** information fausse donnée à la cliente. Gravité élevée.
- **Détection :** question réelle à l'agent pour chaque jour de la semaine, dont le dimanche, puis comparaison avec la table des horaires.
- **Réparation :** lecture des horaires (table `br15_hours`) en parallèle du catalogue, dans le contexte serveur. Les horaires habituels sont explicitement distingués des disponibilités et des absences.
- **Prévention :** toute information que l'agent doit annoncer doit être injectée depuis la base, et couverte par un test de réponse.
- **Test :** test métier (horaires, dimanche fermé, règles de paiement, conservation du prompt et des outils). Question réelle après publication : réponse correcte le 22 octobre.
- **Statut :** corrigé ; testé en préproduction et après publication en production (réponse réelle).
- **Traçabilité :** commit `770b0cd` (sur `main`) ; `docs/validation/20261021-finalisation.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-006 — L'agent ne confirme pas l'absence d'acompte

- **Symptôme :** à la question « faut-il un acompte ? », l'agent ne sait pas répondre de façon fiable.
- **Cause :** démontrée lors d'un test réel du 20 octobre. Les règles commerciales (aucun acompte, paiement sur place, première visite incluse) étaient absentes du contexte natif.
- **Impact :** information client incomplète. Gravité moyenne.
- **Détection :** question réelle sur le paiement et l'acompte, en recette.
- **Réparation :** règles commerciales ajoutées au contexte natif, sans modifier le prompt d'origine.
- **Prévention :** constituer une liste de questions types (acompte, paiement, annulation, horaires) à rejouer à chaque changement de contexte.
- **Test :** question réelle après déploiement ; test métier automatisé.
- **Statut :** corrigé ; testé en réel (20 octobre), recontrôlé le 22 octobre.
- **Traçabilité :** commit `f4c13a4c` ; `docs/validation/20261020-evening.md`.

## HTN-ERR-007 — Fallback local remplaçant l'agent

- **Symptôme :** en cas d'erreur, la cliente recevait des réponses locales simplifiées, sans que ce soit signalé.
- **Cause :** démontrée par lecture du frontend de la V14 (audit du 19 octobre) : un ancien mécanisme de réponses locales.
- **Impact :** exactitude des réponses et transparence. Gravité moyenne.
- **Détection :** revue du frontend à la recherche de réponses codées en dur ; test d'erreur simulée du service IA.
- **Réparation :** en mode natif, aucune substitution. En cas d'erreur, l'interface explique l'indisponibilité.
- **Prévention :** interdire tout repli silencieux qui simule l'agent. Tout repli doit être explicite pour l'utilisateur.
- **Test :** simulation d'une erreur du service IA ; contrôle du message affiché et de l'absence de réponse simulée.
- **Statut :** corrigé (code, 19 octobre) ; testé partiellement (simulations).
- **Traçabilité :** `docs/AUDIT_RECETTE.md` (section « Constats et changements »).

## HTN-ERR-008 — Confirmation annonçant un envoi bloqué en préproduction

- **Symptôme :** la page de confirmation indiquait que les notifications étaient en cours, alors qu'en préproduction aucun envoi n'était possible.
- **Cause :** démontrée. Le message n'était pas conditionné par le mode préproduction.
- **Impact :** information trompeuse pour l'opérateur et les testeurs. Gravité moyenne.
- **Détection :** parcours de confirmation en `APP_ENV=preproduction`, lecture du texte affiché.
- **Réparation :** les réponses serveur identifient le mode de test ; la page et l'agent indiquent qu'aucun e-mail ni SMS n'a été envoyé. Le comportement hors préproduction reste inchangé.
- **Prévention :** tout message décrivant un envoi doit être dérivé de l'état réel (envoyé, simulé, en attente), jamais d'une intention.
- **Test :** contrôle navigateur de la confirmation en préproduction.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `docs/validation/20261020-preproduction.md` (section « Correction apportée »).

## HTN-ERR-009 — Erreurs 503 ponctuelles des fonctions de disponibilité et de chat

- **Symptôme :** une demande de disponibilités ou une conversation renvoie une erreur 503, puis fonctionne à la nouvelle tentative.
- **Cause :** **non confirmée.** Le contrôle des journaux n'a pas couvert toute la fenêtre d'incident. Une latence du service d'authentification a été observée sur le même créneau.
- **Impact :** attente et message d'erreur pour la cliente. Gravité faible à moyenne.
- **Détection :** journaux Netlify par fonction, comptage des 5xx et des temps de réponse.
- **Réparation :** aucune correction identifiée à ce jour.
- **Prévention :** journaliser le code et la durée de chaque appel par fonction ; prévoir une nouvelle tentative côté client pour les erreurs transitoires.
- **Test :** surveillance pendant la recette ; rejouer les mêmes appels à intervalle régulier.
- **Statut :** à surveiller (cause non confirmée).
- **Traçabilité :** `docs/validation/20261020-preproduction.md` (section « Incidents et limites »).

## HTN-ERR-010 — Disponibilités proposées sans contrôle réel (signalement non vérifié)

- **Symptôme (signalé, non reproduit) :** l'agent proposerait un rendez-vous sans vérifier les disponibilités réelles, et réagirait mal lorsque la cliente change d'avis.
- **Cause :** **non établie.** Signalement de la mission confiée à ChatGPT Work ; aucune reproduction faite à ce stade.
- **Impact :** rendez-vous impossible ou double réservation si la vérification est absente. Gravité élevée si confirmé.
- **Détection :** scénario fictif : proposition de créneau, changement d'avis, puis contrôle de l'appel de disponibilité avant toute nouvelle proposition.
- **Réparation :** en cours (mission de correction confiée à Work). Non validée.
- **Prévention :** interdire toute proposition de créneau sans appel de disponibilité du jour. Test de scénario obligatoire.
- **Test :** scénarios fictifs à rédiger dans le contre-audit (mission A).
- **Statut :** à confirmer (non vérifié).
- **Traçabilité :** mission de Belle & Rebelle transmise le 23 octobre 2026.

## HTN-ERR-066 — Affirmation d'heure ou de disponibilité sans consultation du calendrier

- **Symptôme :** Melba affirme un créneau sans l'avoir vérifié : « je vous réserve neuf heures mardi », « il reste une place à midi demain », « votre créneau est bon, je vous attends mardi ».
- **Cause :** démontrée par test adversarial (PR #3, 23 octobre). Le garde-fou textuel `guardedReply` ne reconnaît que les heures en chiffres (« 9 h », « 10:00 ») et quelques formules. Les heures en lettres (« neuf heures », « midi »), les formules « votre créneau est bon » et « je vous réserve » passent.
- **Impact :** information fausse ; une cliente peut croire son rendez-vous pris. Aucune écriture n'est faite sans clic. Gravité élevée.
- **Détection :** envoyer au garde-fou les phrases de `preuves-pr3/adversarial-policy.cjs`, sans résultat d'outil.
- **Réparation :** partielle dans la PR (M01 de Work). **Refusée en l'état.** Correction demandée : sans résultat d'outil, toute mention d'heure (chiffres ou lettres), de jour lié à un créneau, ou de disponibilité est remplacée par une demande de précision.
- **Prévention :** le texte libre du modèle ne porte jamais d'information métier ; les créneaux viennent d'un contrat structuré.
- **Test :** les phrases adversariales ajoutées à `tests/melba-reliability.test.js`, avec attendu « aucune affirmation ».
- **Statut :** partiellement corrigé en `01a9ecd` — les six phrases adversariales sont bloquées, mais « C'est réservé pour vous » et « Parfait, c'est noté » ne le sont pas. **Non résolu.**
- **Traçabilité :** PR #3, commit `a27f935` ; `netlify/functions/lib/melba-policy.js` (`guardedReply`) ; `contre-audit-pr3.md`.

## HTN-ERR-067 — Changement d'avis avec nouvelle demande traité comme un abandon

- **Symptôme :** « je change d'avis, plutôt demain matin » reçoit « Pas de souci ! à bientôt » ; la demande est perdue.
- **Cause :** démontrée par test. La règle `directReply` accepte la formule d'abandon suivie de n'importe quel séparateur, sans vérifier l'absence d'une nouvelle demande, et court-circuite le modèle.
- **Impact :** cliente qui doit répéter sa demande ; aucune écriture. Gravité moyenne (commerciale).
- **Détection :** message contenant une formule d'abandon et une date, une heure ou une préférence.
- **Réparation :** raccourci accepté seulement si le message se limite à la formule d'abandon. Sinon, transmission au modèle. **Correction à faire avant fusion.**
- **Prévention :** un raccourci ne couvre jamais un message porteur d'une intention métier.
- **Test :** « non merci, je change d'avis » → abandon ; « je change d'avis, plutôt demain matin » → transmis au modèle.
- **Statut :** confirmé, non corrigé. **Non résolu.**
- **Traçabilité :** `melba-policy.js` (`directReply`) ; `contre-audit-pr3.md`.

## HTN-ERR-069 — Durée prise pour une préférence horaire

- **Symptôme :** « je voudrais 1h30 de soin » enregistre une préférence « matin ».
- **Cause :** démontrée par test. La fonction `preference` traite tout motif HHhMM comme une heure de début.
- **Impact :** créneaux filtrés à tort, préférence imposée. Gravité faible à moyenne.
- **Détection :** phrases contenant une durée au format HHhMM.
- **Réparation :** interpréter HHhMM comme heure seulement après « à », « vers », « entre » ou « de » ; sinon demander. **À corriger.**
- **Prévention :** distinguer dans le texte les durées des heures avant toute extraction.
- **Test :** « 1h30 de soin » → pas de préférence ; « à 10h » → matin ; « vers 15h » → après-midi.
- **Statut :** confirmé, **non corrigé en `01a9ecd`** (second contre-audit). « je voudrais 1h30 de soin » est bien traité, mais « un soin de 1h30 » ou « soin de 2h, de 10h à 12h » donne « matin » : la préposition « de » reste ambiguë.
- **Traçabilité :** `melba-policy.js` (`preference`) ; `contre-audit-pr3.md` ; `contre-audit-2-01a9ecd.md`.
