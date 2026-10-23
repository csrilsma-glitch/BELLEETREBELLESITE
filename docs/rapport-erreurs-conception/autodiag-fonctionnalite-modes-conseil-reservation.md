# AutoDiag — Fonctionnalité : mode conseil et mode réservation de Melba (24 octobre 2026)

Demande du propriétaire (captures « Le futur fonctionnement de Melba ») : Melba accueille par « Bonjour ! Vous avez besoin d'un conseil ou vous souhaitez réserver ? », puis passe explicitement en mode conseillère ou en mode agent de réservation, et annonce chaque changement.

## Comportement livré (branche `fix/20261024-melba-baby-modes`)
- Salutation seule au début : question d'accueil ci-dessus (mot « Bonjour » seul, sans historique).
- Mode réservation : demandé par « réserver », « réservation », « rendez-vous », « rdv ». Le parcours existant est inchangé.
- Mode conseil : demandé par « conseil », « conseiller », « lequel me… », « laquelle me… ». Réponse du modèle sans aucun outil, sans créneau, sans réservation, sans coordonnée demandée.
- Annonce à chaque changement : « Je passe en mode conseillère. » / « Je passe en mode agent de réservation. ».
- Le mode est conservé dans le contexte signé. Les informations de réservation déjà données ne sont pas effacées par un passage en mode conseil.
- Plafond IA quotidien appliqué à la salutation comme aux autres messages.

## Tests
- `tests/melba-baby-modes.test.js` : salutation, changements de mode, absence d'outil en mode conseil, absence de coordonnées demandées en mode conseil, plafond.

## Limites connues (à vérifier avant mise en production)
- Le passage de mode repose sur des mots-clés explicites. Une formulation libre sans ces mots reste dans le mode courant.
- En mode conseil, une demande de date ou de prestation n'ouvre pas la réservation : la cliente doit dire « réserver ».
- Le modèle est simulé dans les tests. Le ton réel et la qualité des conseils restent à vérifier sur téléphone.
- Le parcours complet demandé par Work (Nom, puis Prénom, E-mail, Téléphone, un seul sujet par message, reprise après rafraîchissement) n'est pas encore refait : voir la transmission.
