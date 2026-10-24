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
