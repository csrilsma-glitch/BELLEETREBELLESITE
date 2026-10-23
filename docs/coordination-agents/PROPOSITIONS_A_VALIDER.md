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
