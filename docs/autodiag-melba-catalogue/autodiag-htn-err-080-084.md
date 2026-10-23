# AutoDiag — HTN-ERR-080 à HTN-ERR-084 : catalogue complet de Melba (24 octobre 2026)

Identifiants suivant la numérotation déjà utilisée (dernier identifiant sur `main` : HTN-ERR-074 ; HTN-ERR-075 à 079 sont sur la branche `docs/rapport-erreurs-conception-20261023`). Branche : `fix/20261024-melba-catalogue-complet`, au-dessus de `c7376ac`.

## HTN-ERR-079 — « Baby boomer » non reconnue (rappel)
Documenté sur la branche docs `docs/rapport-erreurs-conception-20261023`. Présent aussi sur `main` (moteur de Work) : reproduit avant correction. Corrigé ici par la reconnaissance par famille (`matchServices`, `familyHint`).

## HTN-ERR-080 — Nom composé coupé par un séparateur : prestation non reconnue
- **Symptôme :** « popits et demi popits Popits court ou medium » et « Kit complet + prise de mesure » ne sont pas retrouvés alors que le nom complet existe.
- **Cause :** le moteur de Work découpe le message sur « + » et « et » avant de chercher ; « et » fait partie du nom de la famille « Rallongement popits et demi popits » et de « Remplissage en 3 et 4 semaines ».
- **Reproduction :** `tests/melba-catalogue-complet.test.js`, 4 prestations (popits court, popits long, demi, remplissage 3 et 4). Échec avant correction.
- **Correction :** le nom complet est essayé d'abord ; le découpage n'a lieu que si le nom complet ne donne pas une prestation unique, et seulement si le message contient « + » ou « et ».
- **Détection automatique :** pour chaque prestation, envoyer son nom complet et vérifier qu'une seule prestation est retenue.

## HTN-ERR-081 — Noms qui partagent des mots : mauvaise prestation ou ambiguïté injustifiée
- **Symptôme :** « Remplissage après 5 semaines de repousses » ambigu avec « Remplissage en 3 et 4 semaines » ; « Demi popits court ou medium » ambigu avec « Popits court ou medium » ; « Rallongement popits et demi popits Demi popits long » idem.
- **Cause :** la reconnaissance comptait seulement si les mots du nom étaient présents, sans distinguer le nom le plus précis.
- **Correction :** chaque candidat est jugé sur les mots du message qu'il explique (nom et famille nommée). Le candidat qui explique le plus de mots l'emporte ; à égalité, le nom complet qui apparaît en suite dans le message, le plus long.
- **Non-régression :** les 64 prestations, en « famille + nom » et en chemin complet (`tests/melba-catalogue-complet.test.js`, `tableau-64-prestations.md`).
- **Limite :** un nom qui n'existe que dans plusieurs familles (« Quatre doigts », « Mains complètes ») reste une question de précision : c'est voulu, Melba ne choisit jamais au hasard.

## HTN-ERR-082 — Échec préexistant sur `main` : `targeted-ui` (bouton « Trouver des créneaux » désactivé)
- **Symptôme :** `tests/targeted-ui.cjs` échoue sur `/reservation.html?prestations=gel,deco` : `#find-slots` reste désactivé après saisie de la date 2030-10-28.
- **Constat :** identique sur `c7376ac` (`origin/main`), sans les changements de cette branche. Ce n'est donc pas une régression de Melba.
- **À traiter par Work :** vérifier si la date de test est hors de la fenêtre de réservation, ou si le bouton dépend d'une règle de la page. Non corrigé ici, pour ne pas toucher à la page de réservation.

## HTN-ERR-083 — Majuscule parasite après « Pour <date>, »
- **Symptôme :** « Pour lundi 26 octobre 2026, Préférez-vous le matin ou l’après-midi ? ».
- **Correction :** la question est mise en minuscule après la virgule.
- **Test :** `tests/melba-catalogue-complet.test.js` (parcours complet et modes).

## HTN-ERR-084 — Réponse de conseil pendant une réservation en cours
- **Symptôme possible :** pendant le mode conseil, « Matin » aurait reçu un conseil d'entretien, la réservation paraissant perdue.
- **Correction :** une réponse de réservation (date, matin, heure) pendant le mode conseil reçoit « Votre réservation en cours est conservée. Dites « je veux réserver » pour reprendre où nous en étions. » sans appel au modèle. Le contexte de réservation est conservé.
- **Test :** `tests/melba-catalogue-complet.test.js`, « Deux modes ».
