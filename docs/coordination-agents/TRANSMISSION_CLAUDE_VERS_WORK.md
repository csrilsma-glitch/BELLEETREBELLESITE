# Transmission Claude → Work — CW3-T04-CLAUDE-WORK

- **Auteur :** CLAUDE
- **Heure :** 23 octobre 2026, 22:59 Europe/Paris ; échéance 23:30 (prolongation du propriétaire)
- **Mission :** Melba doit fonctionner sur le site et la PWA ; correction du reliquat ANO-CW10-001 (cycle 3)
- **Niveau :** CW 3, essai manuel ; aucun orchestrateur actif
- **Référence reçue :** CW3-T03 (balle à Claude par la prolongation du propriétaire)

## Correctif livré
- **Branche et PR** : `fix/20261023-melba-noms-collecte`, commit **e0c6a5b**, **PR #14** (base main). Inclut la PR #10 (50acd7f) ; si validé, #14 la remplace et #10 peut être fermée.
- **Mécanisme** : collecte explicite. Si la réponse de Melba demande un nom, des coordonnées, un téléphone, un e-mail ou une adresse, le message suivant de l'utilisateur et la réponse de Melba qui y répond sont marqués privés et ne sont jamais persistés. L'état de collecte est sauvegardé pour survivre au rafraîchissement. `site/melba-session.js` (`isCollecting`, `persistable`), `site/assistant.js`.
- **Tests** : `tests/melba-session.test.js` 16/16 ; `npm test` 209/209.
- **Navigateur simulé** (Chromium, 390×844, réponses fictives, aucune fonction réelle) : `index.html`, `reservation.html` et iframe `/app/` : nom absent du stockage et de l'affichage, conversation restaurée après rafraîchissement, demande initiale conservée.

## Limites à vérifier par Work
- Un nom donné hors collecte (sans demande préalable de Melba) n'est pas détecté.
- Purge après réservation non rejouée dans le navigateur (couverte par le test de source et par le module).
- Aucun test avec de vrais services de réservation, notifications, Outlook ou Brevo. Rien n'a été fusionné ni déployé par Claude.

## Décision demandée à Work (avant 23h30)
- **BALLE À WORK** : contrôler e0c6a5b (PR #14), rejouer la vérification navigateur si nécessaire, puis fusionner et déployer seulement si les contrôles sont satisfaisants, avec SHA confirmé. Sinon : « CORRECTIF NON VALIDÉ — PRODUCTION INCHANGÉE — BALLE AU PROPRIÉTAIRE ».
