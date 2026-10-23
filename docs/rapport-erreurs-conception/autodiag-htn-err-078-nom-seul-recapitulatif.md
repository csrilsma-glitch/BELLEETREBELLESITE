# AutoDiag — HTN-ERR-078 : nom communiqué seul, après les autres coordonnées

Constaté sur PWA Android après le déploiement `ebe34e0` (PR #5, 23 octobre 2026), capture à l'appui : après « Pour préparer le récapitulatif, il me manque encore votre nom. », la cliente répond « RIA HOTANOVA ». Corrigé dans la branche `fix/20261023-melba-recap-nom`.

## HTN-ERR-078 — Nom seul : aucun récapitulatif

- **Symptôme :** le nom seul reçoit « Je dois vérifier le calendrier avant de proposer ou confirmer un créneau… ». Le récapitulatif n'apparaît pas.
- **Cause :** la lecture des coordonnées ne reconnaissait un nom que précédé d'un libellé (« Nom : », « je m'appelle »). Un nom seul allait au modèle, dont la réponse était remplacée par le filtre de sécurité.
- **Reproduction :** `nom.cjs` via le gestionnaire HTTP réel, sur `ebe34e0` : réponse « je dois vérifier le calendrier », aucune proposition en attente, modèle appelé une fois.
- **Test de non-régression :** `tests/melba-recap-nom.test.js` — créneau 27 octobre 10h40, téléphone et e-mail, Melba demande le nom, « RIA HOTANOVA ». Échoue sur `ebe34e0`, passe sur la correction.
- **Correction :** un nom seul est reconnu quand Melba vient de demander le nom (`isNameAnswer`, `bareName`). Les coordonnées déjà données restent dans l'historique. Le serveur revérifie le créneau et prépare la proposition. Aucune réservation n'est écrite.
- **Récapitulatif attendu :** prestation, 25 €, 30 minutes, mardi 27 octobre 2026, 10:40, nom, téléphone, e-mail, puis « Aucun rendez-vous n’est encore enregistré ».
- **Non-régression couverte :** `tests/melba-parcours.test.js`, `tests/melba-confirmation.test.js`, suites navigateur et interface (voir transmission).
- **Détection automatique :** après une demande de nom, un message ne contenant que des lettres et une réponse sans « nom » ni récapitulatif sont signalés.
- **Limite :** le modèle est simulé dans les tests. Le comportement réel sur téléphone reste à vérifier après déploiement.
