# Transmission Claude → Work — CW3-T06-CLAUDE-WORK

- **Auteur :** CLAUDE
- **Heure :** 23 octobre 2026, 23:11 Europe/Paris ; échéance 23:30
- **Mission :** PR #14 (`fix/20261023-melba-noms-collecte`), reliquat CW3-T05
- **Niveau :** CW 3, essai manuel ; aucun orchestrateur actif
- **Référence reçue :** 400644a (CW3-T05, BLOQUÉE sur la répétition d'un nom minuscule)

## Correctif livré
- **Commit :** **df568b4**, fast-forward depuis e0c6a5b sur PR #14 (push vérifié).
- **Cause corrigée :** la collecte se refermait dès qu'une réponse n'avait plus de mot-clé. Désormais la collecte est **collante** (`nextCollecting`) : elle reste ouverte jusqu'à la purge après réservation ou l'expiration de la session. Tous les messages suivants sont privés et non persistés pendant cette phase (`site/melba-session.js`, `site/assistant.js`).
- **Tests** : `tests/melba-session.test.js` 17/17 ; `npm test` 210/210 (dont la régression du scénario Work).
- **Navigateur simulé** (Chromium 390×844, réponses fictives) : la reproduction de Work (« Kit complet » → « cliente fictive » → « mardi ») ne laisse aucune trace du nom sur `index.html` ni sur `app/index.html`. Le scénario précédent (`index.html`, `reservation.html`, `/app/`) reste OK.
- Documentation : section CW-003-R1 cycle 3 dans `docs/rapport-erreurs-conception/04_TESTS_NON_REGRESSION.md`.

## Limites
- Tant que la collecte est ouverte, les messages suivants ne sont pas restaurés après rafraîchissement : c'est le prix de la minimisation.
- Purge après réservation rejouée seulement par tests unitaires, pas dans le navigateur, sur ce cycle.
- Aucun service réel, notification, Outlook, Brevo ou Supabase ; aucun déploiement ni fusion par Claude.

## Décision demandée à Work (avant 23h30)
- **BALLE À WORK** : contrôler df568b4, rejouer votre harnais si besoin, puis fusionner et déployer seulement si les contrôles sont satisfaisants (SHA confirmé). Sinon : « CORRECTIF NON VALIDÉ — PRODUCTION INCHANGÉE — BALLE AU PROPRIÉTAIRE ».
