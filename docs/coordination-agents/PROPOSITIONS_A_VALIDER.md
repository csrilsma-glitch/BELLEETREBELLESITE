# Propositions à valider

Une proposition n'est jamais une autorisation. Aucune des missions ci-dessous n'est lancée automatiquement.

| ID | Objectif / justification | Priorité / agent | Modifications et risques | Autorisation / statut |
|---|---|---|---|---|
| PROP-001 | Préparer validation complète du clic Confirmer jusqu'à Supabase, Outlook, emails/SMS et rappels ; le récapitulatif seul ne prouve pas ces étapes | Haute / Claude développe les preuves, Work contre-vérifie ensuite | Tests fictifs isolés, plan des essais réels séparé ; prévenir doubles réservations/envois/coûts | Accord du propriétaire requis ; EN_ATTENTE_VALIDATION |
| CW-003 | Corriger perte de conversation au rafraîchissement reproduite | Haute / Claude | Persistance minimisée, durée limitée, purge après fin, éviter coordonnées et actions périmées en cache ; tests rechargement et changement d'utilisateur | Accord du propriétaire requis ; EN_ATTENTE_VALIDATION |
| PROP-002 | Finition : nom parfois demandé deux fois | Basse / Claude | Reproduire avant correction ; ne pas réinitialiser les coordonnées | Accord requis ; EN_ATTENTE_VALIDATION |
| PROP-003 | Intégrer PR #7 après vérification indépendante et autorisation | Haute / Work | Relire main/HEAD, tests du SHA exact, sauvegarde et déploiement regroupé ; ne pas confondre simulation et réel | Fusion et production explicitement non autorisées actuellement ; EN_ATTENTE_VALIDATION |

## Proposition CW-003-R1 — 23/10/2026, Work
- Statut : **EN_ATTENTE_VALIDATION**. Destinataire : CLAUDE. Priorité haute.
- Objectif : corriger uniquement ANO-CW10-001 (noms persistés) et ANO-CW10-002 (ancien historique ressauvé après succès), puis corriger l'information de couverture /app/ dans la PR #10.
- Justification : la confidentialité conditionne son intégration autorisée ; 202 tests verts ne couvrent pas ces cas.
- Modifications envisagées : minimisation du module, purge durable, régressions ciblées et transmission/AutoDiag. Aucun nouveau parcours ni réglage sensible.
- Risques : perdre la continuité utile, invalider des signatures ou conserver une ancienne proposition. Préserver le contexte métier autorisé sans coordonnées.
- Critères : pas de noms/téléphones/e-mails dans storage, y compris messages assistant et noms libres ; rafraîchissement de la coque /app/ ; TTL déterministe ; succès suivi de « Merci » ne réenregistre pas l'ancien contexte ; aucune action de confirmation restaurée.
- Cycle : 1/3 pour chaque anomalie. Autorisation du propriétaire nécessaire ; aucune nouvelle mission lancée.

## Après CW3-T04 — propositions non exécutées
- **ARBITRAGE-CW003** — propriétaire, EN_ATTENTE_VALIDATION : critère de confidentialité non rempli après cycle 3/3 (nom minuscule). Décider d'une approche structurée de persistance métier, puis d'une mission Claude ciblée. Aucun quatrième cycle implicite ni déploiement.
- **ORCH-PILOT-001** — EN_ATTENTE_VALIDATION : lire PROPOSITION_ORCHESTRATEUR_GITHUB.md, choisir agents CI ou hybridation, budget et périmètre. Premier essai proposé avec deux faux agents sans modèle, secret ou production. Aucune installation ni mise en route autorisée par l'étude seule.


## Clôture PR14 — 23/10/2026,23:19 Paris
ARBITRAGE-CW003 : prolongation propriétaire a autorisé le correctif ciblé ; livré df568b4, intégré PR14 et déployé6790096. L'ancien blocage de répétition du nom en collecte est levé. Les autres propositions restent EN_ATTENTE_VALIDATION ; aucun lancement automatique. Aucun travail sur orchestrateur dans cette mission.


## Après MELBA-PERIOD-001 — 24octobre2026
Aucun développement suivant lancé. Contrôle physique Android du refus de période : EN_ATTENTE_VALIDATION uniquement si souhaité ; trois interfaces déjà contrôlées en ligne et Chromium3formats automatisé. Ne pas demander de répéter les tests déjà couverts.


## MELBA-DATE-SHORT-001
Fusion/déploiement du correctif date abrégée : EN_ATTENTE_VALIDATION. Interdiction actuelle du propriétaire de déployer. Préparation/testés seulement, aucune fusion automatique.


## PR21 consolidée après019d701
Relecture finale Claude demandée par le propriétaire, transmission publiée. Fusion/déploiement toujours EN_ATTENTE_VALIDATION du propriétaire ; aucune autorisation de fusionmain/déploiement reçue pour cette intégration.


## Après MELBA-REFUS-MOIS-001
Relecture finale ciblée Claude demandée par le propriétaire. NouvelleHEAD dePR21 documentée dans commentaireWork. Fusion/déploiement toujours EN_ATTENTE_VALIDATION ; ne rien publier à ce stade.
