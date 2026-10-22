# Rapport permanent des erreurs de conception — Belle & Rebelle

Base de connaissances technique réutilisable pour les futurs sites HOTANOVA, le module AutoDiag et le guide d'installation client.

Ce dossier répertorie les problèmes rencontrés pendant la conception et la recette de Belle & Rebelle (V15), avec leur cause, leur réparation, leur prévention et le test qui permet de vérifier qu'ils ne reviennent pas.

## Principes de lecture

1. **Aucune anomalie n'est présumée présente.** Chaque entrée indique si le problème a été démontré, corrigé, testé, ou s'il reste à surveiller. Une correction historique n'est pas une garantie de l'état actuel de la production.
2. **Cause démontrée ou hypothèse.** Quand la cause n'est pas établie, l'entrée le signale explicitement (« cause non confirmée »).
3. **Pas de données clientes ni de secrets.** Aucun identifiant de réservation réel, numéro, adresse e-mail, jeton, clé ou identifiant fournisseur n'apparaît dans ce dossier.
4. **Traçabilité.** Les commits référencés ont été vérifiés comme présents dans l'historique de `main` (clone récupéré le 23 octobre 2026). Les Pull Requests ne sont pas consultables depuis cette session (accès lecture seule).
5. **Catégories.** Les dix catégories demandées sont présentes. Certaines entrées ne sont pas des défauts du site : HTN-ERR-060 (comportement attendu) et HTN-ERR-017 (limite de l'environnement de test). HTN-ERR-018 est une limite de l'outil de test, traitée par une méthode adaptée.

## Statuts utilisés

| Statut | Signification |
|---|---|
| **Confirmé** | Le problème est établi par une preuve (code, journal, test, observation réelle). |
| **Corrigé** | Une réparation a été appliquée au code, à la base ou à la configuration. |
| **Testé** | La correction a été vérifiée par un test (automatisé, SQL, navigateur simulé, ou réel selon la mention). |
| **À surveiller** | Corrigé ou atténué, mais à contrôler en situation réelle ou cause non confirmée. |
| **Non résolu** | Le problème subsiste ou dépend d'une décision ou d'une action humaine. |
| **Non-défaut** | Comportement attendu, classé ici pour éviter une fausse alerte. |

Un statut combiné (par exemple « Corrigé — testé sur base de test ; à surveiller sur appareil réel ») est volontairement précis : il ne faut pas résumer un test de simulation en validation physique.

## Catégories

| Fichier | Catégorie | Entrées |
|---|---|---|
| [01-reservations-disponibilites.md](01-reservations-disponibilites.md) | Réservations et disponibilités | 001–004, 070 |
| [02-ia-conversationnelle.md](02-ia-conversationnelle.md) | Intelligence artificielle conversationnelle | 005–010, 066, 067, 069 |
| [03-dates-fuseaux-horaires.md](03-dates-fuseaux-horaires.md) | Dates et fuseaux horaires | 011–013, 068 |
| [04-interface-responsive.md](04-interface-responsive.md) | Interface et ergonomie responsive | 014–018, 071–073 |
| [05-pwa-cache.md](05-pwa-cache.md) | PWA et cache | 019–024 |
| [06-authentification-sessions.md](06-authentification-sessions.md) | Authentification et sessions | 025–031 |
| [07-calendriers-synchronisations.md](07-calendriers-synchronisations.md) | Calendriers et synchronisations | 032–040 |
| [08-notifications-services-externes.md](08-notifications-services-externes.md) | Notifications et services externes | 041–048 |
| [09-deploiement-configuration.md](09-deploiement-configuration.md) | Déploiement et configuration | 049–058 |
| [10-securite-protection-donnees.md](10-securite-protection-donnees.md) | Sécurité et protection des données | 059–065 |

Le registre complet, avec statuts et commits, est dans [registre.md](registre.md). Les sources lues et les limites de vérification sont dans [sources-et-limites.md](sources-et-limites.md).

Contre-audit de la PR #3 de ChatGPT Work : verdict et correctifs demandés dans [contre-audit-pr3.md](contre-audit-pr3.md). Sondes AutoDiag dérivées : [recommandations-autodiag.md](recommandations-autodiag.md). Preuves et cas adversariaux de Work : dossier [preuves-pr3/](preuves-pr3/).

## Modèle d'entrée

Chaque entrée suit le même gabarit, pour pouvoir être reprise telle quelle par AutoDiag ou par le guide d'installation :

- **Identifiant** : `HTN-ERR-NNN`, numérotation continue.
- **Nom** : description courte.
- **Symptôme** : ce que voit l'utilisateur.
- **Cause** : origine technique démontrée, ou hypothèse à confirmer.
- **Impact** : gravité et fonctionnalités concernées.
- **Détection** : contrôle automatique ou manuel permettant de repérer l'anomalie.
- **Réparation** : correction appliquée.
- **Prévention** : disposition à intégrer dans les futurs templates.
- **Test** : méthode de non-régression.
- **Statut** : voir tableau ci-dessus.
- **Traçabilité** : commits, migrations, documents sources.

## Mise à jour

Ce dossier doit être complété à chaque nouvelle erreur, en gardant les anciennes entrées. Une entrée n'est jamais supprimée : une erreur corrigée reste utile comme règle de prévention. Les entrées issues du contre-audit de la PR #3 (066 à 073) ont été ajoutées à la suite, avec la même numérotation continue.
