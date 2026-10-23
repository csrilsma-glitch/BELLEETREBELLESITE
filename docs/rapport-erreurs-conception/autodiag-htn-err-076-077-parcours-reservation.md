# AutoDiag — HTN-ERR-076 et HTN-ERR-077 : parcours de réservation de l'assistant

Constatés sur PWA Android après le déploiement `c0c20e0` (23 octobre 2026). Corrigés dans la branche `fix/20261023-melba-parcours` (`3ba662f`).

## HTN-ERR-076 — Date et heure dans le même message : créneau non reconnu

- **Symptôme :** la cliente répond « Le 27 octobre à 10h40 » à une liste de créneaux ; l'assistant répète la liste et demande de choisir. « 10h40 » seul fonctionne.
- **Cause :** la reconnaissance du choix n'acceptait qu'un message réduit à l'heure. Une date dans le message envoyait la demande vers le modèle, qui relançait la recherche.
- **Test de reproduction :** `tests/melba-parcours.test.js`, étape « Le 27 octobre à 10h40. » (échec sur `c0c20e0`).
- **Correction :** l'heure est lue après « à » quand le message contient une date ; la date du message prime sur la mémoire ; la disponibilité est revérifiée.
- **Non-régression :** « Mardi 27 à 10h40 », « Le 27/10 à 10:40 », « Le 27 octobre à 10h40 svp ».
- **Détection automatique :** pour chaque créneau proposé, envoyer « <jour> <date> à <heure> » et vérifier que la réponse ne reprend aucune autre heure de la liste.

## HTN-ERR-077 — Coordonnées reçues mais aucun récapitulatif

- **Symptôme :** après nom, téléphone et e-mail, l'assistant répond « Je dois vérifier le calendrier avant de proposer ou confirmer un créneau » ; aucun récapitulatif, aucune suite.
- **Cause :** les coordonnées n'étaient pas traitées par le serveur : le message allait au modèle, dont la réponse évoquait la disponibilité, et le filtre de sécurité la remplaçait par ce message générique.
- **Test de reproduction :** conversation complète dans `tests/melba-parcours.test.js` ; reproduction directe sur `c0c20e0` avec le message exact de la cliente.
- **Correction :** les coordonnées sont lues dans l'historique ; le serveur revérifie la disponibilité et prépare une proposition (`pendingBooking`). Le récapitulatif indique la prestation, le prix, la durée, la date, l'heure. Rien n'est enregistré avant le clic sur Confirmer.
- **Non-régression :** `tests/melba-parcours.test.js` (coordonnées en plusieurs messages, récapitulatif, « je confirme » dans le chat) ; `tests/melba-confirmation.test.js` (suite de confirmation isolée : créneau pris, confirmation absente, création unique).
- **Détection automatique :** après des coordonnées complètes, la réponse doit contenir le récapitulatif et une proposition, ou une question précise ; jamais une formule générique sur le calendrier.

## Règles de prévention (tous sites)
1. Une réponse qui désigne un créneau ou une date est traitée par le serveur, pas par le modèle.
2. Les informations déjà données (prestation, préférence, date, coordonnées) sont relues dans l'historique et ne sont jamais redemandées.
3. Une réservation n'est créée qu'après le clic de confirmation ; le chat ne confirme jamais.
