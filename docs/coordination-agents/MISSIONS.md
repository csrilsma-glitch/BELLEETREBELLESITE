# Registre officiel des missions

Statuts autorisés : PROPOSÉE, EN_ATTENTE_VALIDATION, AUTORISÉE, EN_COURS, BLOQUÉE, TERMINÉE, REFUSÉE.

| ID / date | Objectif / responsable | Statut et autorisation | Référence | Tests / résultat | Prochaine action |
|---|---|---|---|---|---|
| CW-001 / 23-10-2026 | Babyboomer, Claude | TERMINÉE pour la livraison du code ; revue Work favorable ciblée | fix/20261023-melba-babyboomer-services ; 6bf3a31 ; PR #7 | 195 tests ; problème détecté sur main, corrigé localement | Ne pas fusionner sans autorisation |
| CW-002 / 23-10-2026 | Audit indépendant, Work | TERMINÉE pour l'audit autorisé par message RAPPORT CW ; validation limitée au correctif | work/cw-002-audit-20261023 (prise en charge) ; 6bf3a31 audité | UI /app/ locale + HTTP, calendrier/modèle simulés ; perte au reload confirmée | Lire HISTORIQUE/20261023-WORK-CW-002-004.md |
| CW-003 / 23-10-2026 | Persistance conversation, Claude | EN_ATTENTE_VALIDATION selon instruction définitive ; non exécutée | site/assistant.js, aucun correctif | Reproduction fournie par Work | Proposer une persistance minimisée, sûre et limitée ; attendre accord |
| CW-004 / 23-10-2026 | Vérification intégrations, Work | TERMINÉE pour lecture seule autorisée ; limites explicites | Supabase production / Resend, aucun commit applicatif | 64 services, indicateurs Outlook sains ; Brevo non vérifiable directement | Validation réelle distincte si autorisée |
| CW-005 / 23-10-2026 | Plan déploiement/retour arrière, Work | TERMINÉE pour rédaction documentaire ; exécution NON autorisée | HISTORIQUE/20261023-WORK-plan-deploiement.md | Procédure et conditions d'arrêt documentées | Attendre autorisation de fusion/déploiement |
| COORD-001 / 23-10-2026 | Installer ce protocole, Work | TERMINÉE pour installation et publication ; fichier utilisateur joint autorise docs, PR et fusion documentaire uniquement | docs/installation-coordination-definitive-20261023 ; PR #9 ; commit initial 92bb83d | Périmètre Markdown seul contrôlé, lecture distante effectuée | Fusion documentaire autorisée, sans déploiement fonctionnel |
| PROP-001 / 23-10-2026 | Préparer validation de bout en bout, Claude | EN_ATTENTE_VALIDATION ; aucune autorisation d'exécution | Voir PROPOSITIONS_A_VALIDER.md | Aucun test nouveau lancé sous cette proposition | Décision du propriétaire |

## Niveau CW et champs obligatoires (23/10/2026, Claude)
Chaque mission indique : **Niveau CW** (1, 2 ou 3, défaut 1), **Objectif**, **Agent ayant la main**, **Actions autorisées**, **Budget maximal** (défaut : 2 suites complètes, 0 déploiement intermédiaire, 3 tentatives par erreur), **État d'avancement**, **Prochain destinataire**, **Condition d'arrêt**. Modèle : `MODELES/MISSION_TEMPLATE.md`. Règles : `NIVEAUX_CW.md`.
