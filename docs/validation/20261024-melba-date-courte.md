# MELBA-DATE-SHORT-001 — « Le26 » ignoré à l’étape date

24octobre2026 — Work. Mission directe du propriétaire : corriger et tester, **NE PAS DÉPLOYER**. Base main03e9dc802073ff0c9f6aa8a1d50428b04e87038e ; application productionb4ee16cb21dc7499497de59f21b423806446b812. Branche fix/20261024-melba-date-courte.

## Symptôme / cause vérifiée
Capture Android04:11 : Babyboomer deux doigts7€/10min → « Le26 » → répétition de la question date. hasDateExpression et requestedDate reconnaissaient les dates complètes, les jours nommés et les relatifs, mais pas un numéro du jour isolé. Le gestionnaire ne consultait donc jamais le calendrier.
Reproduit par tests HTTP avant correction : la réponse restait à date et aucun créneau n’était consulté. Pas un problème à traiter par promptIA.

## Correctif minimal
- Nouvelle fonction pure abbreviatedDate : reconnaît « Le26 », «26», «le1er», avec éventuellement matin/après-midi, heure ou politesse. Résout la prochaine occurrence civile valide en Europe/Paris si aucun mois n’est précisé.
- Appel uniquement aux étapes date ou alternative du moteur déterministe. Les nombres de prestations, prix, durées, coordonnées et réponses aux étapes nom/heure ne deviennent pas automatiquement des dates. hasDateExpression et requestedDate globaux restent inchangés.
- Si un mois est déjà fixé dans l’état, le conserve ; si la cliente choisit parmi des dates proposées, utilise le mois de la date correspondante. Le mois inféré est affiché dans la réponse avec le jour et l’année.
- Jour0/32 ou date impossible : message explicite et aucun appel calendrier. Pas de normalisation31novembre →1décembre. Si le numéro est passé sans mois, prochaine occurrence valide ; année suivante gérée.
- La date résolue rejoint le même moteur availability, avec les mêmes prestations et préférences. Aucun horaire inventé, aucune insertion. Le correctif précédent refus de période/autre date est conservé.

## Preuves exécutées
-9nouveaux tests : formes courtes ; mois/année ; heure française au passage de minuit ; mois ancré et invalides ; exclusion prix/durée/prestations/coordonnées/dates complètes ; scénario Android HTTP exact ; préférence matin ; jour invalide sans lecture ; nom numérique non interprété ; choix d’une autre date dans un mois futur.
- npm test : **341/341**, zéro échec.
- node tests/melba-date-courte-browser.cjs : Chromium accueil1440x1000, reservation.html820x1180, /app/390x844. Vrais clients et gestionnaire HTTP ; calendrier et fournisseurs isolés. Babyboomer deux doigts →Le26 →calendrier après-midi →Non le Matin →rechargement →Oui →Le27 →créneaux matin →10h40 →nom ; stop et purge. Trois parcours réussis, aucun clic Confirmer ni écriture.
- npm run check et git diff --check exécutés. Les tests complets SQL/rappels non répétés : aucune modification des fonctions SQL, des réservations ni des jobs. Pas d’appareil Android/iPhone physique.

## État de livraison
**CORRIGÉ ET TESTÉ EN BRANCHE — NON FUSIONNÉ — NON DÉPLOYÉ.** Commit et PR figurent dans GitHub. Commit et titre PR marqués skip netlify pour éviter une construction de preview. Aucun changement main/production, configuration, secret, compte, tarif, média, donnée cliente ou fournisseur. Aucun SMS, e-mail, événement Outlook ou réservation réel.

## Prévention AutoDiag
Tests melba-date-courte.test.js + melba-date-courte-browser.cjs. Critère : lorsqu’une date est attendue, un numéro de jour valide doit être interprété dans le contexte, la date complète affichée et le calendrier consulté. Une interprétation contextuelle ne doit pas devenir une reconnaissance numérique globale.

Prochaine étape : fusion/déploiement **EN_ATTENTE_VALIDATION**, interdit par l’instruction actuelle. Aucun cycleClaude lancé et aucune intervention manuelle demandée pour refaire les tests automatisés.


## Consolidation Work après contre-revue Claude —24octobre2026
### Autorisation et provenance
Mission directe : intégrer019d701 dans la PR21, tester et transmettre, **sans fusion main ni déploiement**.
La branche audit/melba-date-horaire pointe sur **019d70119bca4d2014483171abea1aa23c7e859f**, enfant direct de **a609b19c0810ace0e53ca1d28e1abf16cd44e251**. Diff Claude :2fichiers,25ajouts/2retraits. L’intégration garde ce commit dans l’ascendance de la PR21 ; aucun cherry-pick destructeur ni force-push.
Le message complet du commit et le diagnostic transmis par le propriétaire ont été lus. Aucun rapport détaillé Claude séparé n’est présent dans019d701 ni dans les commentaires/reviews de la PR21 consultés : ce document ne prétend pas en avoir lu un absent. La vérification indépendante ci-dessous ne dépend pas d’un verdict supposé favorable.

### Défaut corrigé par Claude
Aux étapes période/horaire, «le28» n’était pas interprété comme changement de date. L’ancien jour pouvait donc rester jusqu’au récapitulatif. Le correctif accepte un jour abrégé explicitement précédé de «le» à ces étapes ; un entier seul n’est pas une nouvelle date. La date et le calendrier sont mis à jour avant de poursuivre.

### Complément Work nécessaire
Les348tests Claude passent initialement. Son cas «14» établit seulement que la date reste inchangée. Un test plus strict échoue sur019d701 : aucun horaire n’est sélectionné (start=undefined). Ajout de l’interprétation14→14:00 **uniquement à l’étape horaire** ; cette heure doit exister dans les disponibilités relues avant passage au nom. Aucun changement global du parseur de dates/heures ni des règles métier.
Test supplémentaire conservé, suite finale **349/349**,0échec. Le fixture Claude fige aussi l’horloge du parseur de jour abrégé pour éviter une dépendance à la date d’exécution.

### Recette indépendante exécutée
- node --test tests/melba-date-horaire.test.js :8/8 ; les7cas Claude plus la sélection effective de14h.
- npm test :348/348 sur019d701 avant complément, puis349/349 après complément.
- node tests/melba-date-horaire-browser.cjs : vrais clients, vrais gestionnaires HTTP, migrationsSQL PGlite jetables. Accueil1440x1000, réservation820x1180, /app/390x844. Multi-sélection gel+Babyboomer :100min/59€.
- Scénario exécuté à la date de mission :26octobre →changement à l’étape période vers27 →Matin →changement à l’étape horaire vers28 →14 →nom/prénom/e-mail/téléphone fictifs →récapitulatif **mercredi28 à14h,100min/59€**. Assertions sur la date complète affichée, pas seulement l’état interne.
- Nouveau changement après collecte complète : modifier ma date →29octobre →Après-midi →14 →récapitulatif29 avec mêmes coordonnées, prestations, durée et prix, sans redemander les coordonnées. Rafraîchissement et récapitulatif relu. Confirmation en base locale uniquement : date29/14h,100min,5900centimes vérifiés en SQL ; purge,6jobs simulés, annulation locale.3réservations jetables, aucun accès fournisseur réel.
- tests/melba-date-courte-browser.cjs :Le26, refus matin, rechargement, recherche autre jour, Le27, horaire, nom, stop ;3interfaces :OK.
- npm run test:melba-alternatives :refus/insistance/persistance/cumul3interfaces :OK.
- npm run test:targeted-ui :390/820/1440px,select/clavier, réponses tardives/invalidation :OK.
- npm run test:browser :PC/tablette/mobile/paysage, crâne, réservation, annulation, Manager,2PWA et caches ; lecture initiale des12MP4originaux :OK. Aucun visionnage intégral ni téléphone physique.
- npm run check :40JSvalides et64prestations. Comparaison des fichiers catalogue/arbre avec la base :aucune modification. Les tests Node relisent et vérifient64prestations et leurs intitulés/familles/prix/durées ; cumul réel SQL testé ci-dessus.
- git diff --check :OK. La première exécution du nouveau fixture navigateur échouait sur l’aliasSQL réservé day ; fixture corrigé, les3parcours finaux sont réussis.

### Résultat et limites
**PR21 consolidée/testée, EN_ATTENTE_REVUE_FINALE_CLAUDE.** Ni fusion main ni déploiement Netlify. Productionb4ee16c conservée ; main03e9dc8 conservé. Commit de consolidation et PR traçables surGitHub. Aucune réservation/message/événement réel, secret, paramètre production, droitManager, tarif ou donnée cliente modifié.
La recette complète utilise exclusivement SQL local/fournisseurs simulés : pas une validation de réception réelleResend/Brevo/Outlook. Pas d’Android/iPhone physique. Aucun contournement d’authentification. Les réserves historiques restent ouvertes.

### Relecture demandée à Claude
Vérifier le descendant de019d701 dans la PR21, le complément heure entière limité à l’étape horaire, les récapitulatifs28/29 et les preuves jointes. Déposer le verdict surGitHub. **Ne pas fusionner ni déployer** : décision finale du propriétaire. Aucun réveil ou cycle autonome lancé.


## Dernière consolidation : refus et mois suivant
Voir20261024-melba-refus-mois.md :2défauts connus corrigés aprèsac03d6e,357tests et recettes navigateur réussis. PR21 non fusionnée, aucun déploiement ; revue ciblée Claude attendue. Cette section remplace les anciennes règles de refus et de jour ancré devenues obsolètes ; les preuves précédentes restent historiques.
