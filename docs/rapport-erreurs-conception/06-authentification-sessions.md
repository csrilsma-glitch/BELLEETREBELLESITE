# 06 — Authentification et sessions

Principes en place : le Manager exige un jeton vérifié par le service d'authentification, un cookie `HttpOnly`, `Secure` et `SameSite=Strict`, une limitation des tentatives, et un contrôle du rôle (compte présent et actif dans la liste des gérants). Les jetons ne sont jamais exposés au JavaScript de la page.

## HTN-ERR-025 — Connexion Manager refusée (identifiants)

- **Symptôme :** la connexion au Manager échoue avec une erreur d'identifiants.
- **Cause :** démontrée par les journaux du service d'authentification (19 octobre) : « invalid_credentials ». La cause retenue est le mot de passe du compte, non modifié par l'agent. **Un défaut du produit n'est pas démontré.**
- **Impact :** la gérante ne peut pas accéder à son Manager. Gravité élevée pour l'usage.
- **Détection :** consultation des journaux d'authentification ; test de connexion avec le compte réel par la gérante.
- **Réparation :** réinitialisation du mot de passe par le propriétaire depuis le tableau de bord, sans intervention technique de l'agent.
- **Prévention :** message d'erreur clair (identifiants incorrects) distinct des erreurs techniques ; procédure de récupération documentée.
- **Test :** connexion réelle par la gérante, à faire. Test automatisé de récupération : 9 parcours réussis (sans e-mail réel).
- **Statut :** non résolu pour la connexion personnelle de bout en bout (à confirmer par la gérante elle-même).
- **Traçabilité :** `docs/ETAT_NUIT_2026-10-19.md` ; `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-026 — Enrôlement MFA déclenché sans action explicite

- **Symptôme :** l'enrôlement de l'authentificateur se lançait sans que l'utilisateur le demande ; un double clic pouvait créer deux enrôlements.
- **Cause :** démontrée par la vérification du parcours (22 octobre).
- **Impact :** confusion et facteurs multiples. Gravité moyenne.
- **Détection :** parcours de connexion sans facteur vérifié ; double clic sur « enregistrer ».
- **Réparation :** le QR n'apparaît qu'après une action explicite ; double clic bloqué ; saisie du code attendant l'enrôlement.
- **Prévention :** toute création de facteur est une action explicite, protégée contre le double envoi.
- **Test :** tests navigateur du premier enrôlement, du facteur déjà vérifié et du mauvais code récupérable (API simulées).
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-027 — Code MFA saisi sans identité de compte affichée

- **Symptôme :** l'utilisateur ne sait pas quel compte est concerné avant de saisir son code, et peut utiliser le mauvais authentificateur.
- **Cause :** démontrée par la revue du parcours (22 octobre).
- **Impact :** code d'un autre compte, échecs répétés. Gravité moyenne.
- **Détection :** parcours MFA : vérifier l'affichage du compte avant la saisie.
- **Réparation :** identité du compte connecté affichée avant la saisie du code.
- **Prévention :** afficher le compte concerné à chaque étape d'une authentification forte.
- **Test :** contrôle navigateur de l'écran de saisie.
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-028 — QR et clé de MFA restant affichés

- **Symptôme :** le QR code et la clé secrète d'un facteur restaient visibles après validation ou déconnexion.
- **Cause :** démontrée à la revue du parcours.
- **Impact :** exposition d'un secret d'authentification à une personne de passage. Gravité élevée.
- **Détection :** après enrôlement, puis après déconnexion, vérifier l'absence du QR et de la clé dans le DOM.
- **Réparation :** effacement du QR et de la clé après validation, déconnexion ou expiration de session.
- **Prévention :** ne jamais laisser un secret affiché au-delà de l'étape qui en a besoin.
- **Test :** test navigateur : déconnexion puis contrôle de l'absence du secret.
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261022-finalisation-production.md`.

## HTN-ERR-029 — Exception temporaire de MFA pour deux comptes

- **Symptôme :** deux comptes Manager se connectent sans second facteur.
- **Cause :** décision explicite du propriétaire le 22 octobre 2026, motivée par l'impossibilité de finaliser l'enrôlement personnel. Présente dans le code de `main` (`PASSWORD_ONLY_MANAGERS` dans `netlify/functions/lib/core.js`).
- **Impact :** risque de sécurité élevé pour les données clientes accessibles par le Manager. Ce risque est **accepté temporairement**, pas résolu.
- **Détection :** lecture du code : la liste d'identifiants exemptés est présente.
- **Réparation :** retirer les deux identifiants de la liste après validation personnelle du nouveau parcours MFA, puis publier.
- **Prévention :** toute exception de sécurité doit être datée, motivée, liée à un identifiant immuable et associée à une date de retrait.
- **Test :** après retrait, connexion de chaque compte exige un second facteur vérifié (aal2).
- **Statut :** **confirmé — en place**, risque accepté, à résorber.
- **Traçabilité :** commit `bb4bf6f` (HEAD de `main` au 23 octobre) ; `docs/validation/20261022-manager-password-only.md`.

## HTN-ERR-030 — Runner de test d'authentification exposé

- **Symptôme :** un point d'entrée de test d'authentification restait actif sur le projet de test.
- **Cause :** démontrée par le rapport du 20 octobre : runner d'intégration conservé après usage.
- **Impact :** point d'entrée inutile sur un environnement de test. Gravité moyenne.
- **Détection :** requête HTTP sur le point d'entrée ; vérifier les paramètres de vérification de jeton.
- **Réparation :** runner remplacé par une réponse inerte HTTP 410 avec vérification de jeton ; compte de test bloqué ; code de référence conservé dans `tests/live-auth/`.
- **Prévention :** tout outil de test d'authentification est désactivé après usage et documenté comme tel.
- **Test :** requête vers le point d'entrée : refus attendu ; compte de test vérifié bloqué.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `docs/validation/20261020-auth.json` (résultats booléens) ; `docs/validation/20261020-preproduction.md`.

## HTN-ERR-031 — Lenteur transitoire du service d'authentification

- **Symptôme :** une première tentative de connexion ou de sauvegarde est lente, la seconde réussit.
- **Cause :** **non confirmée** ; observée le 21 octobre, sans erreur durable.
- **Impact :** attente. Gravité faible.
- **Détection :** mesurer la durée des appels d'authentification sur plusieurs tentatives.
- **Réparation :** aucune identifiée.
- **Prévention :** délai d'attente explicite, message de nouvelle tentative, journalisation des durées.
- **Test :** répéter les connexions à intervalles réguliers pendant la recette.
- **Statut :** à surveiller.
- **Traçabilité :** `docs/validation/20261021-finalisation.md`.
