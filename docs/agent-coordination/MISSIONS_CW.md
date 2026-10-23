# Registre des missions CW

Chaque mission a un identifiant unique. Une mission résolue n'est jamais recréée.

| ID | Responsable | Priorité | Dépendances | Objet | Critères de réussite | Statut |
|---|---|---|---|---|---|---|
| CW-001 | CLAUDE | Haute | — | Correctif de la boucle Melba « babyboomer 2 doigts » / « 10h40 » (PR #7, branche `fix/20261023-melba-babyboomer-services`, commit `6bf3a31`) | Tests de régression verts ; `npm test` vert ; transmission publiée | `A_VERIFIER_WORK` |
| CW-002 | WORK | Haute | CW-001 | Audit indépendant de la PR #7 : relecture, vérification du correctif, parcours complet de réservation (navigateur, PWA), conservation de la conversation, réservations Supabase, intégrations de confirmation, risques résiduels. Tests sur données fictives uniquement. | Rapport d'audit publié ; statut `VALIDE_WORK` ou `CORRECTION_CLAUDE` avec scénario reproductible | `EN_COURS` |
| CW-003 | CLAUDE | Haute | — | Perte de la conversation au rafraîchissement de la PWA (historique et contexte gardés uniquement en mémoire dans `site/assistant.js`) | Reproduction par test ; correctif en PR séparée ; aucune régression sur CW-001 | `A_FAIRE` |
| CW-004 | WORK | Moyenne | CW-002 | Vérification de Supabase, Outlook, Resend et Brevo après correctif | Aucune écriture ni notification réelle pendant les tests ; rapport publié | `A_FAIRE` |
| CW-005 | WORK | Moyenne | CW-002 | Plan de déploiement et de retour arrière, sans déployer | Procédure écrite et relue ; exécution uniquement après autorisation explicite de l'utilisateur | `A_FAIRE` |

**Ordre de traitement :** CW-001 → CW-002 (Work), en parallèle de CW-003 (Claude) → CW-004 → CW-005.

**Mission attribuée à Work pour l'instant :** CW-002 (audit de la PR #7). Périmètre de Work : auditer le correctif, vérifier le parcours complet de réservation, la conservation de la conversation sur PWA, les réservations Supabase et les intégrations nécessaires à la confirmation. Work inscrit ensuite dans le rapport ce qui fonctionne, ce qui échoue et les corrections attribuées à Claude.
