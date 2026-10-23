# Transmission à Work — nom communiqué seul après les coordonnées (Melba)

**Branche à déployer :** `fix/20261023-melba-recap-nom`, au-dessus de `ebe34e0` (PR #5, actuellement sur `main`).
**Ne pas fusionner ni déployer avant validation. Work déploie après l'accord de Mélanie.**

## Ce qui est corrigé
- HTN-ERR-078 : après « il me manque encore votre nom », une réponse « RIA HOTANOVA » produit le récapitulatif (avant : « je dois vérifier le calendrier »).
- Aucun autre comportement modifié : design, prestations, tarifs, durées, calendrier, notifications, confirmation.
- Cache PWA renouvelé : `br-v15-20261023-recap-nom`.

## Tests
- `tests/melba-recap-nom.test.js` : échoue sur `ebe34e0`, réussit sur la correction. Aucune écriture (`book` interdit).
- `node --test tests/*.test.js` : 193/193.
- `scripts/check.js` : OK. Tests SQL et rappels : OK.
- Navigateur (site, targeted-ui, Manager, MFA, récupération) : OK, Chromium préinstallé.

## Limites
- Le modèle est simulé. Le comportement réel sur téléphone reste à vérifier après déploiement.
- Aucun test en production ni sur appareil physique depuis cette session.

## Vérifications après déploiement (Android, PWA après actualisation)
1. Demande complète jusqu'au 27 octobre à 10h40.
2. Téléphone et e-mail sur un message.
3. Melba demande le nom ; répondre « RIA HOTANOVA » seul.
4. Attendu : récapitulatif (prestation, 25 €, 30 min, mardi 27 octobre 2026 à 10:40, nom, téléphone, e-mail), « Aucun rendez-vous n’est encore enregistré », bouton Confirmer. Rien n'est réservé avant le clic.
