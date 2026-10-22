# 03 — Dates et fuseaux horaires

Règle de référence : l'établissement travaille en **Europe/Paris**. Les dates sont saisies en `AAAA-MM-JJ`, les instants en ISO 8601 avec décalage explicite (`Z` ou `±HH:MM`). Les conversions été/hiver ont été vérifiées (tests SQL, 19 octobre 2026).

## HTN-ERR-011 — Date nulle ou sans fuseau acceptée côté serveur

- **Symptôme :** une date vide, mal formée, ou un instant sans fuseau pouvait être accepté et interprété dans le mauvais fuseau.
- **Cause :** démontrée par un test de régression ajouté le 21 octobre : il échouait avant correction (date nulle acceptée), puis réussissait après.
- **Impact :** créneau mal interprété, rendez-vous décalé. Gravité élevée.
- **Détection :** tests avec date nulle, date sans fuseau, format non ISO, fin antérieure au début.
- **Réparation :** validateurs stricts dans le code serveur : une date doit respecter le format `AAAA-MM-JJ` ; un instant doit porter un décalage explicite (`Z` ou `±HH:MM`). Le contrôle « fin après début » est conservé.
- **Prévention :** un validateur unique réutilisé par toutes les fonctions, plutôt qu'un contrôle recopié dans chacune.
- **Test :** tests Node de validation ; contrôle en navigateur sur un créneau inversé (message d'erreur près du formulaire, aucune création).
- **Statut :** corrigé (code vérifié sur `main` : les validateurs `date` et `instant` existent dans `netlify/functions/lib/core.js`) ; testé.
- **Traçabilité :** `docs/validation/20261021-work.md` (section « Correctifs préparés ») ; `netlify/functions/lib/core.js`.

## HTN-ERR-012 — Fenêtre de chargement mensuelle incomplète en fin de mois

- **Symptôme :** dans le Manager, lorsque la date sélectionnée est en fin de mois, certaines réservations du mois n'apparaissaient pas.
- **Cause :** démontrée par correction du 19 octobre : la plage chargée ne couvrait pas toujours la fin du mois.
- **Impact :** agenda incomplet pour la gérante. Gravité moyenne.
- **Détection :** naviguer dans le Manager jusqu'à la fin d'un mois contenant des réservations ; comparer avec la base.
- **Réparation :** fenêtre de chargement couvrant tout le mois, y compris lorsqu'on se trouve à sa fin.
- **Prévention :** tester les bornes de période (premier jour, dernier jour, changement de mois, changement d'heure).
- **Test :** contrôle navigateur du Manager sur un mois se terminant par des réservations ; test de bornes à ajouter aux futurs templates.
- **Statut :** corrigé ; testé partiellement (navigateur simulé).
- **Traçabilité :** `docs/PREPRODUCTION_20261019.md` (section « Corrections »).

## HTN-ERR-013 — Plages d'absence dépendantes du fuseau de l'appareil

- **Symptôme :** une absence saisie depuis un téléphone ou un ordinateur réglé sur un autre fuseau peut être décalée.
- **Cause :** démontrée par la documentation d'installation du Manager : les champs `datetime-local` utilisent le fuseau de l'appareil.
- **Impact :** congés ou pauses enregistrés à la mauvaise heure. Gravité moyenne.
- **Détection :** saisir une absence depuis un appareil réglé hors Europe/Paris, puis comparer la valeur en base.
- **Réparation :** non réalisée. Contournement opérationnel : garder les appareils de la gérante sur Europe/Paris.
- **Prévention :** dans les futurs templates, convertir explicitement les saisies en Europe/Paris et afficher le fuseau à côté du champ.
- **Test :** saisie depuis un appareil réglé sur un autre fuseau ; contrôle de la valeur enregistrée.
- **Statut :** à surveiller (contournement documenté, correction non faite).
- **Traçabilité :** `docs/MANAGER_INSTALLATION.md`.

## HTN-ERR-068 — Date mémorisée écrasant un changement de jour de semaine

- **Symptôme :** la cliente écrit « demain », puis « plutôt vendredi » ; les disponibilités sont interrogées pour demain.
- **Cause :** démontrée par test. Les outils `check_availability` et `book_appointment` remplacent la date du modèle par `context.requestedDate` dès qu'elle existe. Et `requestedDate` ne sait pas lire un jour de la semaine (« jeudi » → null).
- **Impact :** le modèle reçoit des créneaux pour le mauvais jour ; la date affichée reste celle du calcul, mais la cliente peut ne pas la voir. Gravité élevée.
- **Détection :** deux messages successifs avec dates différentes ; contrôler la date interrogée (`preuves-pr3/adversarial-tools.cjs`, cas A).
- **Réparation :** résoudre les jours de semaine côté serveur (prochaine occurrence) ; ne jamais remplacer la date du modèle par une date mémorisée quand le dernier message en contient une autre. **Correction à faire avant fusion.**
- **Prévention :** une seule source de vérité pour la date : le dernier message, puis le serveur.
- **Test :** « demain » puis « vendredi » → vendredi interrogé ; « jeudi matin » seul → jeudi de la semaine suivante si passé.
- **Statut :** corrigé dans le code en `01a9ecd` (`toolDate`, `dateSource`). **Preuve à refaire** : le cas A de `adversarial-tools.cjs` n'initialise pas `dateSource` et ne teste pas le chemin réel. **Non résolu tant que la preuve n'est pas faite.**
- **Traçabilité :** `netlify/functions/chat.js` (`nativeRunTool`) ; `melba-policy.js` (`requestedDate`) ; `contre-audit-pr3.md` ; `contre-audit-2-01a9ecd.md`.

## HTN-ERR-074 — Jour de la semaine identique au jour courant résolu à aujourd'hui

- **Symptôme :** un vendredi, la cliente écrit « vendredi » (ou « plutôt vendredi » après « demain ») ; la date interrogée est aujourd'hui, pas le vendredi suivant.
- **Cause :** démontrée par test (`requestedDate`) : l'écart calculé vaut 0 quand le jour demandé est le jour courant, et ce cas n'est pas traité comme « semaine suivante ».
- **Impact :** créneaux du jour même proposés à la place du vendredi suivant. Gravité moyenne.
- **Détection :** appeler la résolution de date un jour de la semaine égal au jour courant.
- **Réparation :** résoudre vers la semaine suivante, ou demander confirmation. **À corriger avant fusion.**
- **Prévention :** une date relative ne peut jamais égaler « aujourd'hui » sans que le message le dise.
- **Test :** « vendredi » un vendredi → pas la date du jour.
- **Statut :** confirmé en `01a9ecd`, non corrigé. **Non résolu.**
- **Traçabilité :** `melba-policy.js` (`requestedDate`) ; `contre-audit-2-01a9ecd.md`.
