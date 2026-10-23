# Blocages CW

Erreurs non résolues, problèmes techniques, limites des outils et solutions proposées. Un blocage résolu est déplacé dans la section « Résolus » avec sa date, sans être effacé.

## Ouverts

### B-001 — Clone shallow : référence distante non créée après push
- **Constat :** le clone est `--depth 1`. Après un push, la référence `origin/<branche>` n'est pas créée automatiquement, ce qui a fait signaler à tort une branche non poussée par le hook de fin de session.
- **Solution appliquée :** vérification avec `git ls-remote --heads origin <branche>` (source fiable), puis mise à jour de la référence de suivi avec `git update-ref`.
- **Statut :** contourné. À appliquer par tous les agents.

### B-002 — Création de PR via GraphQL refusée
- **Constat :** `gh pr create` échoue depuis une session Claude Code (GraphQL indisponible).
- **Solution appliquée :** création via l'API REST : `gh api repos/csrilsma-glitch/belleetrebellesite/pulls -X POST`.
- **Statut :** contourné.

### B-003 — Mission utilisateur reçue tronquée (première version)
- **Constat :** une version précédente du fichier d'installation s'arrêtait à « Claude pourra alors reprendre ». La version complète a été reçue ensuite et intégralement appliquée.
- **Statut :** résolu le 2026-10-23 (voir le journal).

## Résolus

- **B-003** — résolu le 2026-10-23 (voir ci-dessus).
