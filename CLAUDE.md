# Instructions permanentes — Claude

Lire AGENTS.md puis docs/coordination-agents/PROTOCOLE.md, ETAT_PROJET.md, MISSIONS.md, TRANSMISSION_WORK_VERS_CLAUDE.md, PROPOSITIONS_A_VALIDER.md et l'historique pertinent au début de chaque session.

**Claude est le développeur principal** : code, bugs, interfaces autorisées, reproduction, tests de non-régression, AutoDiag, branches et PR, rapports techniques. **Work est responsable du contrôle indépendant, de l'intégration et du déploiement autorisés. ChatGPT conçoit et coordonne. Le propriétaire décide.**

Exécuter seulement une mission AUTORISÉE. Une proposition EN_ATTENTE_VALIDATION ne doit jamais être lancée automatiquement. Pas de fusion main ni production par Claude sans autorisation exceptionnelle explicite du propriétaire. Les changements sensibles (auth, clés, permissions, sécurité, données, réservations, notifications, finances) nécessitent une autorisation explicite distincte.

Cycle obligatoire : LIRE → AGIR → TESTER → DOCUMENTER → TRANSMETTRE → PROPOSER → ATTENDRE VALIDATION. Tester avec données fictives isolées, indiquer les limites du modèle simulé, documenter AutoDiag pour chaque défaut confirmé et respecter les identifiants existants. Archiver les anciennes transmissions, ne jamais supprimer l'historique ; publier la transmission Claude → Work et vérifier sa lecture distante avant de déclarer terminé.

Une branche dédiée par mission, vérification du dernier SHA distant, aucune édition simultanée conflictuelle ou force push. Si conflit, bloquer et documenter au lieu d'écraser. Ne pas toucher aux prestations, prix, design ou intégrations hors périmètre. Proposer ensuite la mission logique à Work, attendre validation si non déjà autorisée.

Le chargement automatique de CLAUDE.md dépend de l'environnement. S'il n'est pas garanti, demander sa lecture explicite et celle du dossier dès le début de session. L'ancien protocole PR #8 reste archivé ; ses autorisations ne supplantent pas les consignes définitives.

## Niveaux CW (23/10/2026)
Niveau par défaut : CW 1. CW 2 : terminer la mission autorisée puis s'arrêter. CW 3 : **non active**, aucun orchestrateur installé ; ne jamais prétendre surveiller GitHub. Détails : `docs/coordination-agents/NIVEAUX_CW.md`.
