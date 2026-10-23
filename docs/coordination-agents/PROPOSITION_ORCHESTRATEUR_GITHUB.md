# Proposition — orchestration GitHub Claude ↔ intégrateur OpenAI

**Auteur : Work — 23 octobre 2026. Statut : PROPOSÉE / EN_ATTENTE_VALIDATION.**
**Aucun workflow installé, secret créé, agent lancé ou compte facturé par cette étude.**
Cette proposition appartient à la mission de préparation expressément demandée ; son installation et son activation nécessitent un accord distinct. Elle ne prolonge pas l'essai CW3 du 23 octobre après 23:00 Paris.

## 1. Conclusion de faisabilité

GitHub peut piloter un contrôleur événementiel et exécuter des agents CI, sous réserve d'installation, d'authentification et de budget autorisés. Ce n'est pas un moyen établi de réveiller les conversations Claude ou ChatGPT Work ouvertes sur téléphone.

| Composant | Interface effectivement documentée | Différence / état actuel |
|---|---|---|
| Claude développeur | Action officielle `anthropics/claude-code-action`, avec prompt sur événement GitHub ; clé API Anthropic ou jeton OAuth adapté | Nouvelle exécution Claude Code sur runner, pas reprise automatique de la conversation mobile. Aucun identifiant ajouté ici. |
| Intégrateur OpenAI | Action officielle `openai/codex-action`, qui exécute Codex en CI ; `codex exec` est également documenté | Agent CI distinct de ce chat Work ; n'hérite ni du navigateur cloud ni des connexions Netlify/Supabase/Outlook de ChatGPT. |
| ChatGPT Work de cette conversation | Aucune API publique de reprise de cette conversation identifiée dans les sources officielles consultées | Ne pas promettre une équivalence ou une relance automatique. Garder Work manuel si ses capacités spécifiques sont indispensables. |
| Contrôleur | GitHub Actions + scripts déterministes, événements et état Git versionné | À concevoir, tester et autoriser ; aucun contrôleur actuellement actif. |
| Déploiement | Job déterministe distinct, relié à Netlify par une interface autorisée ultérieurement | Pas d'accès production donné au modèle ; permissions et clés à préparer séparément après accord. |

Sources techniques consultées : [Claude GitHub Actions](https://code.claude.com/docs/en/github-actions), [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action), [Codex non interactif](https://learn.chatgpt.com/docs/non-interactive-mode). La documentation confirme ces exécutions CI, pas une API de pilotage de nos chats existants.

## 2. Architecture recommandée (proposition)

**Contrôleur déterministe → développeur Claude CI → tests → revue Codex CI → contrôleur → publication autorisée ou retour ciblé.**

- Branche dédiée `cw-control` : état machine, rapports publics minimisés et journal de transitions. Le code applicatif reste sur sa branche de mission. L'état machine est la référence ; les rapports Markdown sont une projection humaine, pas un ordre exécutable.
- Code du contrôleur et prompts de base dans un commit protégé approuvé. Un patch d'agent ne peut pas modifier son propre budget, ses autorisations, son contrôle de délai ni les workflows.
- Job modèle : lecture du checkout autorisé, modifications locales limitées, production d'un patch et rapport structuré. Aucun jeton de production, aucune session personnelle copiée.
- Job de tests : dépendances verrouillées, données fictives, fournisseurs simulés ; aucun code arbitraire avec secrets de publication.
- Job publieur : lit un patch contrôlé et les preuves du SHA exact ; seul composant disposant des droits d'écriture Git nécessaires. Merge et Netlify uniquement si une autorisation de production bornée existe.
- Tant que les intégrations CI ne sont pas disponibles, alternative hybride : GitHub exécute tests/état et prévient le propriétaire, qui réveille Work. Cette variante ne remplit pas l'objectif « zéro intervention », mais ne prétend pas le faire.

## 3. État machine envisagé (exemple NON installé)

```json
{
  "schema_version": 1,
  "mission_id": "CW-PILOT-001",
  "authorization_ref": "owner-approval-reference",
  "authorization_digest": "digest-of-approved-scope",
  "status": "AUTORISÉE",
  "holder": "CLAUDE_CI",
  "sequence": 0,
  "transfer_id": "CW-PILOT-001-T00",
  "input_sha": "approved-commit-sha",
  "report_path": "reports/mission/report.md",
  "report_sha256": "report-digest",
  "deadline_at": "future-approved-deadline-in-UTC",
  "lease": {"holder": null, "run_id": null, "expires_at": null},
  "budget": {"cycles_max": 3, "cycles_used": 0, "model_runs_max": 2, "model_runs_reserved": 0, "deploys_max": 0, "deploys_used": 0, "usd_cap": 0},
  "last_processed_event": null,
  "last_processed_transfer": null,
  "approved_actions": ["read", "isolated_tests", "propose_patch"],
  "stop_reason": null
}
```

Premier test sans modèle : usd_cap=0, fournisseurs fictifs, aucun déploiement. Avant tout vrai appel, choisir et approuver une enveloppe compatible ; une limite monétaire locale non reliée au fournisseur n'est pas une garantie de facturation maximale.

États proposés : AUTORISÉE → EN_COURS_CLAUDE → À_VÉRIFIER → EN_COURS_INTÉGRATEUR → TERMINÉE, ou retour CORRECTION (compteur incrémenté), BLOQUÉE, SUSPENDUE. La balle revient au propriétaire en état terminal ; ce dernier prime sur tout événement retardé.

## 4. Déclenchement événementiel et secours

Événements envisagés : changement du fichier d'état sur branche de contrôle, transmission structurée validée, ou dispatch explicite du contrôleur. Au lancement, vérifier acteur autorisé, dépôt, mission, séquence, SHA et somme du rapport. Un texte « BALLE À… » dans une issue publique ne doit jamais suffire.

Attention : les événements produits avec `GITHUB_TOKEN` ne redéclenchent généralement pas d'autres workflows ; `workflow_dispatch` et `repository_dispatch` sont des exceptions documentées. Proposition : le contrôleur effectue un dispatch explicite après publication atomique de l'état, ou utilise une GitHub App approuvée ultérieurement. Ne pas compter sur un push de bot qui réveille implicitement toute la chaîne.

Un secours cron GitHub toutes les cinq minutes est techniquement documenté, mais peut être retardé ou omis ; il n'offre ni ponctualité garantie ni arrêt à la seconde. Il lit seulement état/lease/dernier transfert et termine sans appel modèle si rien n'a changé. Les workflows planifiés doivent être présents sur la branche par défaut. [Événements GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

L'outil de tâches ChatGPT consulté dans cette session est limité à une fréquence horaire : il n'est pas ce secours GitHub et n'a pas été activé.

## 5. Exclusion mutuelle et idempotence

- Groupe `concurrency` commun par dépôt et mission, pas par agent ; proposition `cancel-in-progress: false` pour ne pas tuer une écriture en cours. GitHub ne doit pas être utilisé comme une garantie de FIFO ; chaque réveil relit l'état.
- Acquisition d'une lease par comparaison du SHA/sequence attendus et écriture conditionnelle. En cas de conflit, abandon sans appeler un modèle. Le même protocole doit s'appliquer à toute intervention manuelle pendant un pilote.
- Réserver une unité de budget avant de lancer l'agent ; événement et transfert consommés identifiés. Deux événements identiques n'ont pas droit à deux exécutions.
- Un agent rend patch/rapport/sha d'entrée ; le contrôleur rejette un résultat si mission close, délai expiré, lease périmée, head déplacé ou séquence déjà traitée.
- Aucune relance aveugle d'une opération externe incertaine. Relever l'état du déploiement existant avant de retenter ; aucune relance de SMS ou réservation.

Le groupe de concurrence GitHub limite les exécutions simultanées mais ne remplace pas la lease et le contrôle de séquence. [Concurrence GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## 6. Échéance absolue et arrêt

Conserver une date UTC explicite, afficher Europe/Paris et vérifier l'heure avant chaque lancement, transition, commit, merge et déploiement. Arrêter les départs d'étapes assez tôt pour conserver une marge de clôture. `timeout-minutes` borne une exécution, mais n'est pas à lui seul une échéance métier absolue.

Un watchdog local du runner peut annuler un agent à l'échéance ; le contrôleur refuse tout résultat tardif et toute nouvelle opération sensible. Après expiration : statut SUSPENDUE si incomplet, holder OWNER, plus de chaîne ni reprise automatique. Un cron de secours peut matérialiser ultérieurement l'arrêt dans le journal, sans ressusciter la mission.

**Limite à accepter avant installation : GitHub Actions n'est pas un ordonnanceur temps réel.** Il ne garantit ni l'annulation immédiate d'une requête déjà partie ni une fin de build Netlify à une seconde donnée. Pour une exigence stricte « aucune opération externe encore en cours après l'heure », il faut une marge conservatrice, un contrôle externe réellement actif et un contrat clair sur les actions en cours ; ne pas promettre cette garantie avec un cron seul.

## 7. Budget, coûts et limites de capacité

Budget explicite avant activation : nombre d'appels par agent, tours, tokens, durée, cycles, suites et déploiements ; réservation atomique avant consommation. Au plafond : BLOQUÉE, propriétaire, pas d'agent supplémentaire. Modèles et versions d'actions choisis après accord, jamais imposés par un rapport d'agent.

Les runners standards de dépôts publics peuvent bénéficier du régime gratuit GitHub, mais modèles, stockages et autres options ont leurs propres règles. Ne pas extrapoler la gratuité du runner à celle des agents. [Facturation GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Claude Action consomme API ou abonnement selon l'authentification choisie ; ses tours doivent être bornés. Codex Action demande une authentification OpenAI propre à l'exécution CI. Aucun abonnement ChatGPT ou connexion de ce chat ne doit être supposé transférable. Les prix exacts dépendent des modèles, comptes et quotas, non inspectés ici. Aucun montant mensuel garanti ni dépense autorisée par cette proposition.

## 8. Sécurité indispensable

- App GitHub à droits minimaux ou jetons courts, installation limitée au dépôt. Secrets futurs dans le coffre prévu, jamais dans rapports, prompts, état ou code public. Aucun secret ajouté par cette mission.
- Aucune clé de production accessible aux agents/test scripts ; séparer job modèle, tests non fiables et publieur privilégié. Codex Action documente un proxy pour réduire l'exposition de la clé : ne pas injecter une clé OpenAI globale à tout le job.
- Épingler actions aux SHA revus, dépendances verrouillées, checkout de SHA explicite, credentials non persistés. Ne pas exécuter du code de PR avec des secrets via un déclencheur privilégié.
- Entrées de PR/commentaires/rapports non fiables : schéma strict, allowlist d'acteurs, bornes de taille, chemins relatifs autorisés, aucun `eval`/interpolation shell d'instructions reçues. Le modèle ne peut pas élargir son propre périmètre.
- Permissions de production et autorisations de mission immuables pour l'agent ; revue indépendante obligatoire du SHA final. Tout changement d'authentification, données clientes, tarifs ou secrets reste hors périmètre sans accord séparé.
- Journaux minimisés et artefacts sans clés/coordonnées ; dates, identifiants de transfert et hashes suffisent. Pas de sessions navigateur personnelles importées dans les runners.

## 9. Installation future, après validation distincte

1. Choisir : Claude CI + Codex CI pour autonomie réelle, ou modèle hybride avec Work manuel. Confirmer que Codex CI est un remplacement de rôle, pas cette conversation.
2. Approuver mission pilote, budget, deadline, droits et choix de facturation ; aucune activation implicite.
3. Créer un dépôt/branche de test sans données réelles et runners éphémères ; commencer sans IA et sans secrets.
4. Développer et tester le contrôleur, schéma, journal, lease, règles d'arrêt et simulateurs.
5. Après réussite, approuver l'installation des Apps/authentifications nécessaires ; l'utilisateur saisit les secrets dans les services, jamais dans le chat.
6. Autoriser un pilote limité à deux exécutions de modèle et zéro déploiement, sur un défaut fictif.
7. Contre-vérifier les coûts et traces. Seulement ensuite proposer un adaptateur de publication Netlify isolé ; production reste une autorisation distincte.

## 10. Premier test isolé proposé — EN_ATTENTE_VALIDATION

Deux faux agents déterministes : « Claude » produit un patch inoffensif ; « intégrateur » exécute un test et rend verdict. Aucun appel modèle, clé ou réseau de production.

Critères : événements doublés → une seule lease ; mauvais acteur/mission/hash → refus ; événement inchangé → zéro modèle ; erreur → compteur, arrêt à trois ; collision → aucun écrasement ; résultat tardif → refus ; deadline dépassée → OWNER/SUSPENDUE ; objectif validé → OWNER/TERMINÉE, dispatchs futurs sans effet ; consommation et transitions traçables.

**Cette proposition n'installe aucun orchestrateur et ne lance aucune nouvelle mission.**
