# Transmission officielle Work → Claude

Auteur : WORK. Date : 23 octobre 2026, Europe/Paris. Missions : COORD-001 et consolidation des résultats CW-002/CW-004 déjà effectués.

## Installation
Source courante : docs/coordination-agents/PROTOCOLE.md. Lire ensuite ETAT_PROJET.md, MISSIONS.md, cette transmission et PROPOSITIONS_A_VALIDER.md. Instructions racine : AGENTS.md et CLAUDE.md. Historique initial CW conservé intégralement ; aucun rapport antérieur effacé. Documentation AutoDiag existante seulement référencée.

**Claude développe et corrige ; Work vérifie, intègre et déploie après autorisation ; ChatGPT conçoit et coordonne ; le propriétaire décide.**
Le cycle obligatoire est LIRE → AGIR → TESTER → DOCUMENTER → TRANSMETTRE → PROPOSER → ATTENDRE VALIDATION. Ne lancer aucune nouvelle mission proposée sans accord. L'auto-chargement de ces instructions dépend de chaque environnement : leur lecture explicite est obligatoire au début de session.

## Résultats transmis
PR #7 / 6bf3a31 : avis technique favorable ciblé. 195 tests Node, SQL isolé et rappels verts ; tests de régression rouges sur main, verts sur branche. Test indépendant avec vraie UI /app/ et gestionnaire HTTP local : babyboomer 2 doigts / bb-2, 10h40, coordonnées et récapitulatif 7 €/10 min corrects, aucune écriture. Ce n'est pas une validation des fournisseurs réels ni du modèle réel avec ce correctif non déployé.
CW-003 : rafraîchissement de /app/ efface la conversation, reproduit ; aucune correction faite. Pas de nouveau numéro AutoDiag inventé : utiliser CW-003 et compléter le registre AutoDiag existant au début de sa mission autorisée.
Lecture seule Supabase/Resend : voir état et historique ; Brevo non directement accessible. Production inchangée au dernier commit applicatif ccd4ed4, PR #6. PR #7 et #8 laissées intactes, non fusionnées.

## Proposition prioritaire — PROP-001
Préparer une recette complète isolée du bouton Confirmer jusqu'à l'écriture Supabase, Outlook, confirmations et rappels ; intégrer les contrôles anti-doublon et aucune création avant clic. Proposer ensuite les seuls essais réels indispensables avec autorisation distincte, destinataires désignés et nettoyage strict des données fictives.
Inclure le nom parfois demandé deux fois comme finition, sans en faire un blocage majeur. Persistance CW-003 à soumettre séparément : ne pas stocker naïvement coordonnées, liens sensibles ou actions de confirmation dans un cache partagé.

**Statut : EN_ATTENTE_VALIDATION. NE PAS EXÉCUTER PROP-001 NI CW-003 SANS ACCORD.**
Critères futurs : tests de création unique/refus concurrent/annulation/rappels, aucune notification réelle en mode isolé, rapport vérifiable et PR distincte. Ne pas toucher aux tarifs, prestations, sécurité, design ou aux autres dépôts.

## Traçabilité
Branche d'installation : docs/installation-coordination-definitive-20261023 ; PR et SHA d'intégration traçables dans GitHub et dans le compte rendu final. Rapport d'audit : HISTORIQUE/20261023-WORK-CW-002-004.md ; plan : HISTORIQUE/20261023-WORK-plan-deploiement.md. Aucune fusion ni publication fonctionnelle n'est autorisée par ce protocole.
