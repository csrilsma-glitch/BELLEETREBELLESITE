# Transmission à Work — « Baby boomer » et modes conseil / réservation (Melba)

**Branche à relire et valider :** `fix/20261024-melba-baby-modes`, au-dessus de `098f2e5` (lui-même au-dessus de `ebe34e0`, PR #5, sur `main`).
**Aucune fusion ni déploiement effectués par Claude.** La décision de fusion et de déploiement reste celle de Mélanie et de Work, après validation sur téléphone.

## Ce qui est corrigé (HTN-ERR-079)
- « Baby boomer » est reconnue : Melba demande la taille dans la famille (Deux doigts, Quatre doigts, Six doigts, Mains complètes), sans appeler le modèle.
- La taille choisie est enregistrée dans le contexte signé. Melba ne redemande plus la prestation : elle passe à la date.
- Cause réelle : le nom de famille n'est que dans le chemin du catalogue, que la reconnaissance ignorait.

## Ce qui est ajouté (fonctionnalité, AutoDiag dédiée)
- Accueil « Bonjour ! Vous avez besoin d'un conseil ou vous souhaitez réserver ? »
- Mode conseil sans outil, sans créneau, sans réservation ; annonces « Je passe en mode conseillère. » et « Je passe en mode agent de réservation. ».

## Tests
- `node --test tests/*.test.js` : 199/199.
- `tests/melba-baby-modes.test.js` : 6 tests ; 4 échouent sur `ebe34e0`, donc la régression est bien couverte.
- `scripts/check.js`, SQL, rappels, navigateur (site, targeted-ui, Manager, MFA, récupération) : OK.
- Cache PWA : `br-v15-20261024-baby-modes`.

## Ce qui n'est PAS fait (à reprendre avant de déclarer le parcours terminé)
1. Le gestionnaire d'état déterministe demandé dans la mission CW 2 n'est pas construit. Le parcours reste celui de `ebe34e0` avec des corrections ciblées.
2. Ordre demandé : Nom, puis **Prénom**, puis E-mail, puis Téléphone. Le prénom n'est pas demandé séparément ; l'ordre actuel est nom, téléphone, e-mail.
3. Après la date : la période (matin ou après-midi) doit venir après le calendrier, comme dans la mission. Le parcours actuel le demande encore avec la date dans certains cas.
4. Reprise après rafraîchissement : non testée.
5. Les autres prestations de famille (Mains complètes, etc.) sont couvertes par la logique générique, pas par un test par famille.
6. Aucune vérification en production ni sur téléphone depuis cette session (accès bloqué par le proxy). Le modèle est simulé dans les tests.

## Vérifications à faire sur téléphone après déploiement
1. « Je veux réserver » → « Baby boomer » → Melba propose les quatre tailles.
2. « Quatre doigts » → Melba demande la date seulement.
3. « Le 26 octobre » → Melba demande matin ou après-midi, pas la prestation.
4. « Bonjour » → question d'accueil conseil ou réservation.
5. « J'ai besoin d'un conseil sur l'entretien » → « Je passe en mode conseillère. » ; aucune date ni créneau proposé.
6. « Je veux réserver » ensuite → « Je passe en mode agent de réservation. ».
