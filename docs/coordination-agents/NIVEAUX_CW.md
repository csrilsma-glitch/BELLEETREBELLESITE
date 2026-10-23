# Niveaux d'autonomie CW 1 / 2 / 3

Version documentaire du 23 octobre 2026, 21:58 Europe/Paris, par CLAUDE. Source : demande du propriétaire « Ajout du système d'autorisation RAPPORT CW 1 / 2 / 3 ». Ce document complète `PROTOCOLE.md` ; il ne l'écrase pas.

## 0. Principe

Le propriétaire choisit le niveau d'autonomie avec une commande :

- `rapport CW 1` : supervision directe ;
- `rapport CW 2` : mission autonome jusqu'à l'objectif autorisé ;
- `rapport CW 3` : collaboration autonome pendant l'absence du propriétaire, **sous réserve d'un orchestrateur réellement actif** (voir section 7).

**Sans commande explicite, le niveau est CW 1.** La commande ancienne `rapport CW` (sans chiffre) équivaut à CW 1.

Le niveau est inscrit dans `ETAT_PROJET.md` et repris dans chaque mission (`MISSIONS.md`) et chaque transmission.

Aucun niveau ne donne d'autorisation générale. Chaque niveau s'applique à une mission précise, déjà AUTORISÉE par le propriétaire, et dans son périmètre.

## 1. CW 1 — supervision directe

Le propriétaire est présent et supervise.

- Exécuter uniquement les actions déjà autorisées.
- Demander une validation dès qu'une décision ou une nouvelle autorisation est nécessaire.
- Présenter les options et leurs conséquences.
- Attendre la réponse avant toute action concernée.

Cycle : LIRE → AGIR → TESTER → RAPPORT → DEMANDER VALIDATION.

## 2. CW 2 — mission autonome

Le propriétaire autorise à terminer l'objectif défini sans interruptions inutiles.

Claude et Work peuvent :

- prendre les décisions techniques courantes nécessaires à la mission ;
- corriger les erreurs directement liées à l'objectif ;
- exécuter les tests nécessaires ;
- rédiger et mettre à jour les rapports ;
- préparer la transmission à l'autre agent.

Ils ne demandent pas d'autorisation à chaque étape. Mais :

- l'autonomie reste limitée à l'objectif autorisé ;
- les changements sensibles hors périmètre restent interdits ;
- une mission terminée ne déclenche pas automatiquement une nouvelle mission ;
- les agents s'arrêtent après leur rapport final.

**Claude développe et remet son travail à Work. Work vérifie, intègre et déploie uniquement si le déploiement fait partie des actions explicitement autorisées.**

## 3. CW 3 — collaboration autonome (non active)

Le propriétaire veut laisser Claude et Work avancer pendant son absence jusqu'à l'objectif défini.

### Fonctionnement visé

Un orchestrateur :

1. lit les rapports GitHub ;
2. identifie l'agent qui a la main ;
3. vérifie si la mission est terminée ;
4. déclenche l'intervention de l'autre agent si nécessaire ;
5. continue jusqu'à l'objectif final ;
6. fait intervenir Work pour l'intégration et le déploiement final, si autorisés ;
7. arrête toute intervention quand l'objectif est atteint.

Fréquence visée : vérification des rapports toutes les cinq minutes pendant une mission CW 3 active.

### Statut : NON ACTIVE

**Aucun orchestrateur n'est installé.** GitHub seul, Claude et Work ne disposent pas de cette surveillance. Un agent qui lit `CW 3` dans un message ne doit pas prétendre surveiller le dépôt ni programmer de vérifications récurrentes.

Composants nécessaires pour l'activer (non développés, sans mission spécifique) :

- un service réellement actif, hors session de chat, capable de lire GitHub et de lancer les agents ;
- un budget d'exécution configurable (section 5) ;
- une source d'identifiants de mission et de compteurs de tentatives (section 6) ;
- une autorisation distincte du propriétaire pour la mission ciblée.

Tant que ces composants n'existent pas, CW 3 se comporte comme CW 2 sur la mission en cours, avec arrêt après le rapport final.

## 4. Répartition des responsabilités

**Claude** : développe, corrige, teste, documente, transmet à Work.

**Work** : vérifie, intègre, déploie à l'étape finale si autorisé, vérifie le résultat publié, rédige le rapport de clôture, déclare l'arrêt de la mission. Work est responsable de la clôture du cycle.

## 5. Économie des crédits et des ressources

- ne pas relancer inutilement les mêmes tests ;
- privilégier les tests ciblés pendant le développement ;
- exécuter les suites complètes aux étapes pertinentes, notamment avant livraison ;
- réutiliser les preuves encore valables ;
- ne pas répéter les audits généraux sans nécessité ;
- éviter les appels IA inutiles ;
- éviter les déploiements Netlify intermédiaires ;
- préférer les vérifications GitHub légères ;
- **budget maximal d'exécution** : défini par mission dans `MISSIONS.md` (champ « Budget »). Valeur par défaut si absente : 2 suites complètes, 0 déploiement intermédiaire, 3 tentatives par erreur ;
- suspendre le cycle si le budget est atteint et le signaler dans la transmission ;
- détecter les répétitions et les boucles sans progrès.

Ne pas multiplier les opérations parce que le niveau CW 3 est activé.

## 6. Protection contre les boucles

- un identifiant unique par mission ;
- un agent responsable à chaque étape ;
- un statut de transmission ;
- un compteur de tentatives par erreur ;
- détection des rapports identiques d'un cycle à l'autre ;
- limite de reprises sur la même erreur (3) ;
- statut `BLOQUÉE` en cas d'impasse ;
- statut `TERMINÉE` définitif pour le cycle achevé.

Un agent ne relance jamais l'autre indéfiniment.

## 7. Condition d'arrêt obligatoire

**Les agents ne continuent pas à travailler lorsque l'objectif est atteint.**

Ordre de clôture :

1. Claude termine le développement et sa transmission.
2. Work réalise les contrôles et le déploiement final autorisé.
3. Work vérifie le résultat publié.
4. Work actualise `ETAT_PROJET.md`.
5. Work rédige le rapport de clôture.
6. Work écrit exactement : **« OBJECTIF ATTEINT — MISSION TERMINÉE — JE M'ARRÊTE ICI. »**

L'orchestrateur, s'il existe, arrête alors la surveillance et ne déclenche plus de mission. Les améliorations possibles sont proposées dans le rapport, jamais exécutées après clôture.

## 8. Sécurité et autorisations

Les niveaux CW 2 et CW 3 n'autorisent **pas** :

- la suppression de données réelles ;
- la modification de secrets ou de droits d'accès ;
- la désactivation de protections de sécurité ;
- l'envoi de notifications à de vraies clientes ;
- la création de réservations réelles non prévues ;
- la modification des tarifs ;
- un déploiement hors périmètre.

Les actions sensibles non autorisées sont signalées comme BLOQUÉES, sans contournement de la validation. Les autorisations sensibles restent distinctes (`PROTOCOLE.md`, section « Autorisations »).

## 9. Champs obligatoires dans chaque mission

Chaque mission de `MISSIONS.md` indique :

- **Niveau CW** : 1, 2 ou 3 ;
- **Objectif** ;
- **Agent ayant la main** ;
- **Actions autorisées** ;
- **Budget maximal** ;
- **État d'avancement** ;
- **Prochain destinataire** ;
- **Condition d'arrêt**.

Modèle : `docs/coordination-agents/MODELES/MISSION_TEMPLATE.md`.

## 10. Limites techniques

**Protocole documentaire** : applicable immédiatement par les agents lancés. Il ne garantit aucune exécution en arrière-plan.

**Orchestration automatique CW 3** : nécessite un service réellement actif, qui vérifie GitHub et lance les agents. **Non installée.** Aucune mission spécifique ne l'a autorisée.

## 11. Ce que ce document ne fait pas

- ne modifie ni le moteur de réservation, ni le site en production ;
- ne fusionne rien dans `main` ;
- ne déploie rien sur Netlify ;
- n'installe aucun orchestrateur.

---

**RÈGLE FINALE**

- **CW 1** : le propriétaire supervise et valide les étapes nécessaires.
- **CW 2** : les agents terminent leurs tâches autorisées sans interruption, puis s'arrêtent.
- **CW 3** : collaboration automatique jusqu'à l'objectif, **uniquement avec un orchestrateur réellement opérationnel**, avec contrôle des crédits et arrêt obligatoire.

**Claude code. Work intègre, déploie et clôture. Le propriétaire décide du niveau d'autonomie.**

Ne jamais confondre autonomie et travail sans fin.
