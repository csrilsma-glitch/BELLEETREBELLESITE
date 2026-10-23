# Protocole officiel Claude ↔ Work

Projet prioritaire : Belle & Rebelle. Version documentaire du 23 octobre 2026.

**CLAUDE CODE — WORK INTÈGRE ET DÉPLOIE — CHATGPT COORDONNE — LE PROPRIÉTAIRE DÉCIDE.**

## Rôles
- Propriétaire : objectifs, priorités, fonctionnalités, acceptation des résultats, essais sur ses appareils et autorisations sensibles. Décision finale.
- ChatGPT : conception, cahiers des charges, parcours, préparation des missions, analyse des rapports et présentation des décisions. Aucune fusion ni publication automatique.
- Claude : développement principal, corrections, interfaces autorisées, reproduction, tests automatisés, non-régression, branches, commits, PR et AutoDiag. Ne fusionne pas dans main et ne déploie pas en production sans autorisation exceptionnelle explicite.
- Work : relecture, audit indépendant, contrôle des commits et du périmètre, tests, PR, intégration, référence de retour arrière, fusion et déploiement seulement autorisés, vérification du commit publié, PWA/caches/intégrations, transmission et proposition de suite. Pas de développement fonctionnel important sans mission spécifique.

## Cycle obligatoire
**LIRE → AGIR → TESTER → DOCUMENTER → TRANSMETTRE → PROPOSER → ATTENDRE VALIDATION.**
1. Fetch GitHub ; vérifier main, branches, PR et commit cible, sans se fier à la mémoire.
2. Lire ce protocole, ETAT_PROJET.md, MISSIONS.md, la dernière transmission reçue et PROPOSITIONS_A_VALIDER.md ; consulter l'historique pertinent et les instructions racine.
3. Vérifier qu'une mission est AUTORISÉE et qu'aucun autre agent n'édite les mêmes fichiers. Passer EN_COURS avant d'agir.
4. Exécuter seulement cette mission ; respecter les limites explicites les plus récentes du propriétaire.
5. Tester avec données fictives et isoler les fournisseurs ; distinguer simulation, observation réelle et appareil physique. Une suite verte ne prouve pas toute l'exploitation réelle.
6. Archiver la transmission précédente dans HISTORIQUE avant de modifier une transmission courante. Ajouter les résultats sans supprimer les preuves antérieures.
7. Actualiser état, registre, transmission, propositions et AutoDiag pour chaque défaut nouveau confirmé. Référencer les rapports existants sans les dupliquer.
8. Publier sur branche dédiée et relire à distance les documents. Une mission n'est pas terminée tant que rapport et transmission ne sont pas publiés.
9. Proposer la suite avec statut EN_ATTENTE_VALIDATION et s'arrêter. Une proposition ne vaut jamais autorisation ; la commande RAPPORT CW ne transforme pas une proposition en mission autorisée.

## Autorisations et statuts
Statuts : PROPOSÉE, EN_ATTENTE_VALIDATION, AUTORISÉE, EN_COURS, BLOQUÉE, TERMINÉE, REFUSÉE. L'acceptation technique et les limites figurent séparément du statut administratif.
L'autorisation d'une mission couvre ses opérations techniques ordinaires explicitement décrites ; elle n'autorise pas les missions suivantes. Ne pas solliciter de confirmations inutiles pour des opérations déjà autorisées.
Autorisations explicites distinctes : production, authentification, secrets, droits, sécurité, suppression de données, réservations réelles, notifications réelles et opérations financières. Ne jamais exposer de secret ni contourner une confirmation obligatoire.
La présente installation autorise sa PR documentaire et sa fusion, uniquement si documentation seule, sans secret et sans changement applicatif. Aucun déploiement fonctionnel. PR #7 et #8 : ne pas fusionner.

## Branches, transmissions et conflits
Une branche par mission (fix/<date>-<objet>, work/<mission>-<date>, docs/<objet>), identifiant stable, commit de référence et PR. Avant écriture et fusion : relire la tête distante et vérifier la correspondance exacte avec le code validé. Aucun force push ni écrasement du travail d'autrui.
Les mises à jour de référence utilisent une attente explicite du SHA distant. En cas de conflit, BLOQUÉE et rapport individuel historisé ; ne pas remplacer le rapport concurrent.
Transmission : ID, auteur, date Europe/Paris, problème, cause vérifiée ou hypothèse, actions, fichiers, branche, SHA, PR, tests et preuves, limites, risques, prochaine proposition et autorisation requise.
Les instructions directes récentes du propriétaire priment sur le protocole. Les archives CW ne constituent pas une autorisation permanente de nouvelles missions.

## Tests, AutoDiag et prévention des boucles
Chaque bug : identifiant stable, symptôme, cause vérifiée ou hypothèse, reproduction, correction, non-régression, résultat et détection future. Références : docs/rapport-erreurs-conception/ et docs/validation/. Ne pas inventer de nouveau numéro HTN déjà utilisé.
Maximum trois cycles de correction d'une même anomalie ; au-delà documenter le blocage et proposer un arbitrage. Ne pas relancer des tests déjà validés sans changement ou incertitude concrète.

## Déploiement et incident
Work prépare : main et version publiée, sauvegarde Git, diff autorisé, tests pertinents, identité du projet Netlify, variables séparées et absence de données fictives transférées. Après autorisation explicite, fusion du SHA contrôlé et un déploiement regroupé ; vérifier ready, SHA exact et domaine HTTPS. Ne pas rendre public un environnement privé.
Si régression critique : arrêter les actions à effet réel et conserver les journaux sans secrets ; revenir au code de référence par revert ciblé et redéploiement, dans l'autorisation reçue. Un build échoué non publié laisse la version précédente active. Ne pas modifier les données pour réparer un déploiement. Les commandes et conditions spécifiques sont dans HISTORIQUE/20261023-WORK-plan-deploiement.md.

## Sources et chargement des instructions
Le dossier docs/coordination-agents/ est désormais la source courante. L'ancien docs/agent-coordination/ de la PR #8 est conservé dans l'historique pour traçabilité ; il n'accorde aucune autorisation supplémentaire. Ni la PR #7 ni la PR #8 ne sont fusionnées par cette installation.
AGENTS.md et CLAUDE.md sont des points d'entrée. Leur chargement automatique dépend de l'environnement ; au début de chaque session, demander explicitement leur lecture puis celle de ce dossier. Aucun mécanisme autonome intersession ni HOTANOVA CONTROL n'est installé.
