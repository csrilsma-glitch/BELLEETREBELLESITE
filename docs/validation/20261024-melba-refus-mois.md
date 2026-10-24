# MELBA-REFUS-MOIS-001 — derniers correctifs PR21

24octobre2026 — Work. Base ac03d6e56e1b1c7d6ba5ecd14cb7c6185e8961db. Branche PR21 : fix/20261024-melba-date-courte.
Autorisation directe : corriger les deux défauts non bloquants signalés par Claude, tester et transmettre pour revue ciblée. **AUCUNE FUSION MAIN ET AUCUN DÉPLOIEMENT.** Le verdict favorable de Claude sur ac03d6e est annoncé par le propriétaire ; il ne vaut pas une autorisation de publier cette nouvelle version.

## Défaut1 — refus répétés
Symptôme : Babyboomer deux doigts →Le26 →Non →Non →Non. Le refus de rechercher une autre date renvoyait à l’étape date ; les Non suivants répétaient la même question.
Cause vérifiée : la branche alternative traitait Non et Choisir une autre date de la même manière, supprimant la date puis redemandant celle-ci. L’étape date n’avait aucun traitement du refus.
Correction déterministe : état paused conservant sélection et préférence, sans recherche automatique ni prétendue annulation de rendez-vous. Après un refus de proposition, une recherche d’un autre jour peut être offerte ; si elle est refusée, aucune nouvelle question de date. Les Non suivants reçoivent un acquiescement sans question. Deux choix : reprendre ma réservation ou modifier mes préférences. La reprise est explicite ; modifier les préférences recueille matin/après-midi/peu importe puis demande la date, sans affirmer une disponibilité non consultée. Les coordonnées restent dans le cookie protégé, TTLabsolu inchangé30min.

## Défaut2 — passage au mois suivant
Symptôme : Le28 au matin →Le3 produisait3octobre, puis refus de date passée.
Cause : abbreviatedDate renvoyait immédiatement un candidat dans le mois de l’ancre sans vérifier qu’il restait à venir. La boucle de recherche d’une date valide n’était utilisée qu’en l’absence d’ancre.
Correction : applique également la recherche civile bornée au mois de contexte ; avance si le jour est passé ou absent. Exemples :28octobre→Le3 =3novembre ; contexte novembre→Le31 =31décembre ; changement d’année géré. Ne normalise pas31novembre au1décembre. Référence temporelle Europe/Paris. Un mois/une année explicitement fourni reste contrôlé comme tel :3octobre2026 passé et31novembre2026 impossible restent refusés. Un entier14 à l’étape horaire reste14h00, jamais une nouvelle date. Les dates proposées par le calendrier conservent leur contexte de mois.

## Vérification indépendante
8nouveaux tests ajoutés :5échouaient surac03d6e,3confirmaient des garanties existantes. Après correction,8/8passent. Deux anciennes attentes sont actualisées conformément à la demande : Non après refus→pause et non questiondate ; jour31sans mois dans un contexte novembre→prochaine occurrence31décembre, et non date invalide. Aucun test de date explicitement impossible supprimé.
- npm test : **357/357**, zéro échec.
- node tests/melba-refus-mois-browser.cjs : vrais clients et gestionnaire HTTP, calendrier simulé et écritures/fournisseurs interdits. Accueil1440x1000 ; réservation820x1180 ; /app/390x844. Cas exactNon/Non/Non, zéro nouvelle lecture après refus, rechargement et refus encore respecté, reprise par préférences,28oct→Le3nov,14h, coordonnées fictives, récapitulatif3nov/14h/7€/10min, rechargement, coordonnées toujours absentes de sessionStorage, récapitulatif relu et stop/purge. Aucun bouton Confirmer cliqué.
- node tests/melba-date-horaire-browser.cjs :3interfaces, véritables migrations et SQL local jetable. Changements date aux étapes période/horaire et après coordonnées ; récapitulatif à la bonne date ;100min/59€ ; coordonnées conservées ; confirmation et annulation uniquement locales,6types de jobs simulés. Aucun fournisseur réel.
- Parcours existants melba-date-courte-browser.cjs et test:melba-alternatives : réussis sur3interfaces.
- test:targeted-ui :390/820/1440px, clavier/select, invalidation et réponses tardives :réussis.
- test:browser :PC/tablette/mobile/paysage, crâne, réservation, annulation, Manager, deuxPWA et caches :réussis. Lecture initiale12MP4originaux, pas visionnage intégral ni téléphone physique.
- npm run check :40JSvalides et64prestations. Catalogue et arbre inchangés par comparaison Git. Les tests de catalogue complet sont inclus dans357tests ; les tarifs/durées cumulés et données après changement restent vérifiés dans la recette SQL locale.
- git diff --check :réussi. Preuves :docs/validation/preuves-20261024-refus-mois/.

## Livraison / limites
**CORRIGÉ ET TESTÉ — PR21 EN_ATTENTE_REVUE_CLAUDE — NON FUSIONNÉ / NON DÉPLOYÉ.** Le commit exact transmis est indiqué dans le commentaire de clôture de PR21. Aucun force-push, historique ac03d6e/019d701 conservé. Commit et titre PR skip netlify.
Aucune modification main, production, paramètres/secrets, droitsManager/MFA, tarifs, médias ou données réelles. Aucun SMS/e-mail réel, réservation réelle ni événement Outlook réel. Les insertions SQL de recette sont jetables/locales ; elles ne prouvent pas une réception réelle des intégrations. Pas d’Android/iPhone physique. Réserves antérieures inchangées.

## Relecture ciblée Claude
Contrôler : refus de chercher une autre date→pause persistante sans boucle ni lecture ; reprise/préférences explicites ; date courte avec mois courant passé→mois suivant ; conservation de14comme heure ; confidentialité/coordonnées ; non-régression des récapitulatifs. Référence : HEADconsolidée de PR21, SHAexact dans commentaire Work. Le propriétaire décidera ensuite du déploiement ; aucun agent relancé automatiquement.

## Prévention AutoDiag
Symptômes et causes ci-dessus vérifiés par les nouveaux tests. Détecter la régression en exécutant npm test et node tests/melba-refus-mois-browser.cjs. Ne pas transformer une négation en une nouvelle demande de date. Résoudre les jours abrégés seulement dans un contexte date, valider leur occurrence future en heure de Paris, puis consulter le calendrier avant toute proposition de créneau.
