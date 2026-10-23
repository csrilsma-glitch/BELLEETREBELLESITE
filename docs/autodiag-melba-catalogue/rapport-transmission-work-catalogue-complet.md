# Transmission à Work — couverture du catalogue complet de Melba

**Branche :** `fix/20261024-melba-catalogue-complet`, au-dessus de `origin/main` = `c7376ac`.
**Ne pas fusionner ni déployer avant votre revue.** Claude n'a fusionné et ne déploiera rien.

## Ce qui est changé
- `netlify/functions/lib/melba-policy.js` : reconnaissance par famille et par nom complet (`matchServices`), libellé de famille (`serviceLabel`), mode (`wantedMode`).
- `netlify/functions/lib/melba-flow.js` : précision de famille mémorisée dans le contexte signé ; nom complet essayé avant le découpage « + / et » ; libellés avec famille ; majuscule corrigée.
- `netlify/functions/chat.js` : mode conseil (sans outil, sans coordonnées), accueil, annonces de mode, réservation conservée.
- `site/sw.js` : cache `br-v15-20261024-catalogue-complet`.
- Tests : `tests/melba-catalogue-complet.test.js` (89 tests).
- Documentation : `docs/autodiag-melba-catalogue/` (HTN-ERR-080 à 084, fonctionnalité des modes, tableau des 64 prestations, cette transmission).

Votre travail récent est préservé : `melba-flow.js`, `melba-session.js`, l'état de contact chiffré, les PR #14 à #17, la tenue de `6ad1ec0`. Aucun fichier de coordination n'a été modifié. Le code de `ebe34e0` n'a pas été réintroduit.

## Tests
- `node --test tests/*.test.js` : 313/313 (224 de Work + 89 nouveaux).
- Les 89 nouveaux tests : sur `c7376ac`, 61 échouent. La couverture détecte donc le défaut corrigé.
- `tests/melba-sequential-browser.cjs` (/, reservation.html, /app/) : OK, 64 prestations intactes.
- `tests/browser.cjs`, `manager-ui`, `mfa-ui`, `recovery-browser`, `sql`, `reminders`, `scripts/check.js` : OK.
- `targeted-ui` : échec **préexistant sur `main`** (HTN-ERR-082), non introduit ici.

## Couverture des 64 prestations
- Catalogue : `catalogue.js` et `prestations.json` concordent (64 feuilles, noms, durées, prix, chemins).
- « Famille + nom » : 64/64 reconnues par le moteur, et par le parcours HTTP (test par prestation : date demandée, durée exacte, aucune question répétée, aucun appel au modèle).
- Nom seul : 28 noms uniques reconnus ; 36 noms partagés (« Deux doigts », « Mains complètes »…) déclenchent une précision de famille, jamais un choix au hasard.
- Familles : 17 familles, chacune testée (nom de famille → précision → choix successif retenu).
- Multi-sélection : durées et tarifs cumulés, toutes les prestations passent au calendrier.
- Tableau détaillé : `docs/autodiag-melba-catalogue/tableau-64-prestations.md`.

## Dépendances et choix complémentaires
Le catalogue ne définit **aucune dépendance** entre prestations (le champ `sb` est un ordre d'affichage). La sélection multiple passe par le crâne (identifiants) ou par « + » / « et ». Un choix multiple tapé en texte libre (« Deux doigts et Quatre doigts ») reste une précision : à valider si vous voulez le permettre.

## Parcours et modes
- Ordre : prestation → date → période → horaire → nom → prénom → e-mail → téléphone → récapitulatif. Une question à la fois, testé.
- Rafraîchissement : les coordonnées validées sont restaurées par le cookie chiffré ; rien n'est redemandé (testé).
- Données personnelles : absentes du contexte signé, de l'historique persistant, et des messages envoyés au modèle de conseil (testé).
- Mode conseil : sans outil ; réservation en cours conservée ; reprise par « Je veux réserver » (testé).

## Limites restantes
- Le modèle est simulé dans les tests. Le ton réel de Melba et la qualité des conseils restent à vérifier sur téléphone.
- Pas de test en production ni sur appareil physique depuis cette session.
- `targeted-ui` échoue déjà sur `main` (HTN-ERR-082).
- Le cache PWA est renouvelé ; une PWA déjà installée devra être actualisée.

## Vérifications à faire après déploiement (téléphone Android, PWA)
1. « Je veux réserver » → « Baby boomer » → Melba propose les quatre tailles ; « Quatre doigts » → la date seule.
2. « Popits court ou medium » et « Demi popits court ou medium » : chacun la bonne prestation.
3. « Bonjour » → question d'accueil.
4. « Un conseil pour l’entretien ? » → « Je passe en mode conseillère. » ; aucun créneau proposé.
5. Pendant une réservation en cours, « Matin » → message de conservation ; « Je veux réserver » → reprise.
