# PROTOCOLE CW — Claude et ChatGPT Work

**Projet :** Belle & Rebelle — dépôt `csrilsma-glitch/BELLEETREBELLESITE`
**Nom du protocole :** RAPPORT CW
**Agents :** Claude et ChatGPT Work
**Objectif prioritaire :** Melba entièrement fonctionnelle.

Ce document définit le fonctionnement permanent des agents. Il est la source de règles de tous les autres fichiers de `docs/agent-coordination/`.

---

## 1. Principe fondamental

GitHub est la source commune de vérité entre Claude et ChatGPT Work. Aucun agent ne se fie à sa mémoire de session : il lit les fichiers du dossier avant d'agir et écrit dans le journal après chaque mission.

La commande utilisateur **« RAPPORT CW »** suffit pour que l'agent destinataire :

1. accède au dépôt GitHub Belle & Rebelle ;
2. consulte le dernier rapport CW et son historique ;
3. identifie les missions qui lui sont attribuées ;
4. vérifie les modifications effectuées par l'autre agent ;
5. exécute sa mission jusqu'au bout, dans les limites des autorisations ;
6. effectue les tests nécessaires ;
7. documente ses modifications et ses résultats ;
8. actualise le rapport CW sur GitHub ;
9. prépare la mission suivante pour l'autre agent ;
10. prévient l'utilisateur uniquement lorsque son intervention est terminée ou qu'un véritable blocage exige son action.

**La lecture avant chaque mission et l'écriture après chaque mission sont obligatoires.**

---

## 2. Structure GitHub

Dossier : `docs/agent-coordination/`

| Fichier | Rôle |
|---|---|
| `RAPPORT_CW.md` | Point d'entrée unique : état général, dernière transmission, agent attendu, priorités, prochaines missions. |
| `MISSIONS_CW.md` | Registre des missions : identifiant, responsable, priorité, dépendances, critères de réussite, statut. |
| `JOURNAL_CW.md` | Historique chronologique et permanent. Ne jamais écraser une entrée existante. |
| `PROTOCOLE_CW.md` | Ce document. |
| `BLOCAGES_CW.md` | Erreurs non résolues, problèmes techniques, limites des outils, solutions proposées. |

Les rapports AutoDiag existants (`docs/rapport-erreurs-conception/`, `docs/validation/`) sont **référencés, jamais dupliqués**.

---

## 3. Répartition des responsabilités

### CLAUDE — développement et réparation

- analyse du code et recherche des causes ;
- création des correctifs ;
- tests de non-régression ;
- réparation du parcours conversationnel de Melba ;
- préparation des Pull Requests ;
- documentation AutoDiag.

### CHATGPT WORK — audit et intégration

- relecture des Pull Requests ;
- audit technique et de sécurité ;
- vérification indépendante des correctifs ;
- tests du site, de la PWA et des intégrations ;
- vérification de Supabase, Outlook, Resend et Brevo ;
- identification des régressions ;
- validation technique des livrables ;
- préparation des opérations de déploiement et de retour arrière.

Chaque agent peut mener des investigations complémentaires sans attendre d'instructions, dans son périmètre.

---

## 4. Procédure avant chaque mission

Dès réception de « Rapport CW » :

1. récupérer les dernières modifications GitHub (`git fetch` puis vérification du commit distant) ;
2. lire `PROTOCOLE_CW.md` ;
3. lire `RAPPORT_CW.md` ;
4. lire `MISSIONS_CW.md`, `BLOCAGES_CW.md` et les dernières entrées de `JOURNAL_CW.md` ;
5. vérifier les commits, branches et PR concernés ;
6. identifier la mission attribuée à l'agent destinataire ;
7. vérifier qu'aucun autre agent ne modifie simultanément les mêmes fichiers ;
8. passer la mission au statut `EN_COURS` ;
9. exécuter immédiatement.

Ne pas redemander à l'utilisateur ce qui figure déjà dans GitHub.

Si plusieurs tâches sont attribuées au même agent, les traiter par priorité puis par dépendances.

Si aucune mission n'est attribuée, effectuer uniquement les vérifications utiles prévues par le protocole, puis signaler qu'aucune nouvelle tâche n'est en attente.

---

## 5. Procédure après chaque mission

L'agent met à jour GitHub **avant** de déclarer son travail terminé.

Chaque transmission précise :

- identifiant de mission ;
- auteur : CLAUDE ou WORK ;
- date et heure (fuseau Europe/Paris) ;
- problème initial ;
- cause identifiée ;
- actions réellement effectuées ;
- fichiers modifiés ;
- branche et commits ;
- PR concernée ;
- tests exécutés et résultats ;
- problèmes encore présents ;
- risques et limites ;
- recommandations techniques ;
- prochaine mission attribuée ;
- critères de validation ;
- statut final.

Les conclusions distinguent **faits vérifiés**, **hypothèses** et **actions non réalisées**.

L'agent vérifie que son rapport est effectivement accessible sur GitHub (lecture distante du fichier sur la branche publiée).

---

## 6. Communication entre agents

### Transmission Claude → Work

1. Claude pousse son travail sur une branche dédiée.
2. Claude ouvre une PR.
3. Claude documente le correctif et ses tests.
4. Claude attribue une mission de vérification à Work.
5. Claude positionne le statut `A_VERIFIER_WORK`.
6. Claude complète le journal.

### Transmission Work → Claude

**Si le correctif est validé :**
- Work documente les vérifications réussies ;
- Work positionne le statut `VALIDE_WORK` ;
- Work prépare la prochaine mission ou la livraison.

**Si une anomalie est trouvée :**
- Work décrit précisément le problème ;
- Work fournit un scénario reproductible ;
- Work indique les fichiers concernés ;
- Work explique le résultat attendu ;
- Work attribue une mission corrective à Claude ;
- Work positionne le statut `CORRECTION_CLAUDE`.

Claude reprend alors directement à partir du rapport CW.

---

## 7. Gestion des conflits GitHub

Les agents ne doivent jamais écraser mutuellement leur travail.

- utiliser des branches techniques distinctes ;
- ne jamais modifier simultanément la même branche de travail ;
- vérifier le dernier commit distant avant toute écriture ;
- identifier chaque entrée de journal par mission et auteur ;
- préserver les transmissions précédentes ;
- ne jamais forcer un push qui écraserait le travail de l'autre agent ;
- vérifier les changements distants avant de publier une mise à jour du rapport central.

En cas de conflit sur `RAPPORT_CW.md` ou `JOURNAL_CW.md` : ne pas réécrire le fichier distant. Ajouter une entrée identifiée, puis consolider le rapport central après relecture. Si nécessaire, utiliser des fichiers de transmission individuels par mission (`docs/agent-coordination/transmissions/<ID>-<auteur>.md`) et consolider ensuite.

---

## 8. Autorisations permanentes

Pour les missions déclenchées par « Rapport CW », l'utilisateur autorise :

- lecture du dépôt et de la documentation ;
- audits et diagnostics ;
- exécution des tests locaux ;
- création de tests fictifs ;
- création de branches ;
- modifications de code dans le périmètre de la mission ;
- commits et push sur branches dédiées ;
- création et mise à jour de PR ;
- rédaction et actualisation des rapports ;
- communication documentaire entre agents ;
- préparation des correctifs et livrables.

**Aucune autorisation intermédiaire n'est demandée pour ces opérations.**

Restent soumises à validation explicite de l'utilisateur :

- fusion en production ;
- déploiement en production ;
- suppression de données réelles ;
- modification de secrets ou de permissions sensibles ;
- opérations irréversibles ;
- dépenses ou souscriptions payantes.

Si un outil impose une confirmation, cette confirmation est respectée.

---

## 9. Prévention des boucles entre agents

- ne pas créer une succession infinie de corrections ;
- chaque anomalie porte un identifiant stable (`ANO-…`) ;
- un correctif refusé est accompagné de nouvelles preuves ;
- **limite de trois cycles de correction par anomalie** : au-delà, documenter un blocage dans `BLOCAGES_CW.md` et demander un arbitrage à l'utilisateur ;
- ne pas recréer une mission déjà résolue ;
- ne pas déclarer une fonctionnalité opérationnelle sur la seule base de tests simulés.

---

## 10. Confirmation de fin de mission

Après chaque exécution de « Rapport CW », l'agent adresse à l'utilisateur un message court :

> **RAPPORT CW — MISSION TERMINÉE**
> - Mission effectuée : …
> - Résultat obtenu : …
> - Tests réussis ou anomalies restantes : …
> - Rapport GitHub mis à jour : oui / non
> - Prochain agent attendu : Claude, Work ou aucun
> - Blocage nécessitant une décision : …

Ne jamais annoncer une mission terminée si le rapport n'a pas été publié, sauf en cas d'échec GitHub clairement signalé.

---

## 11. Statuts

| Statut | Signification |
|---|---|
| `A_FAIRE` | mission créée, non commencée |
| `EN_COURS` | un agent travaille dessus |
| `A_VERIFIER_WORK` | correctif poussé, PR ouverte, audit de Work attendu |
| `CORRECTION_CLAUDE` | Work a trouvé une anomalie, Claude doit corriger |
| `VALIDE_WORK` | audit réussi, prêt pour la suite ou la livraison |
| `BLOQUEE` | blocage documenté dans `BLOCAGES_CW.md` |
| `TERMINEE` | livrée et validée par l'utilisateur |
