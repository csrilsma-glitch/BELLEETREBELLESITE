# MELBA-SAFE-CLARIFY-20261024 — rapport Work

## Périmètre et autorisation
Mission directe du propriétaire : sauvegarde de la version production réellement validée par lui ; corrections minimales dates ambiguës et nombre de doigts, tests fictifs locaux, PR et transmission Claude. **Aucune fusion ni aucun déploiement autorisé.** Pas de modification de Supabase, données réelles, secrets, tarifs ou services. Pas de nouveau cycle CW ni orchestration.

## Référence récupérable
Stable/main `4960ca8dceb762dd55f2c166cf8333d53be0ad90`, Netlify `6adc2d56e3c423f4f52a53b4` ready, publié24/10/2026 06:00:40 Paris. Branche distante complète `backup/melba-stable-20261024` créée avant les changements fonctionnels. Guide et manifeste : `docs/backup/melba-stable-20261024/`.
Tag annoté local seulement ; publication distante bloquée par authentification GitHub et absence d'outil de création de tag. Objet annoté reconstructible sauvegardé dans la PR. Protection distante/immutabilité de référence non réalisée. La sauvegarde Git complète est récupérable ; la demande de tag distant protégé reste partiellement accomplie. Pas de copie de données ni secrets externes ; leur plan de sauvegarde est dans le guide.

## Causes et corrections
- **MELBA-DATE-CLARIFY-20261024** : l'ancien flux utilisait abbreviatedDate et la prochaine occurrence, contrairement à la nouvelle consigne de prudence. Nouveau module pur melba-date et état signé `dateParts`/`dateContext` : jour/mois/année explicitement connus, clarification progressive, zéro appel calendrier avant date complète. Le mois/année d'une date résolue ou d'une alternative unique déjà proposée peuvent être réutilisés. Un contexte qui placerait le nouveau jour dans le passé déclenche une clarification plutôt qu'une supposition de mois suivant. «14» en étape horaire reste14h. Préférence, prestations et contacts ne sont pas effacés. Les refus et reprise restent possibles pendant clarification.
- **MELBA-FINGER-NUMBER-20261024** : normalisation lexicale limitée aux nombres de doigts et singulier/pluriel.2/4/6 correspondent à deux/quatre/six ; la sélection finale est filtrée sur les vraies feuilles du catalogue. Ambiguïté sans famille demande une précision ;3doigts inexistant est refusé avec les options réelles. Aucun prix/durée/catalogue modifié.

Fichiers applicatifs : `netlify/functions/lib/melba-date.js` nouveau ; melba-flow.js et melba-policy.js modifiés. Clients HTML/JS, moteurs de réservation/notifications/Outlook/Manager et schéma SQL inchangés. Les 64 prestations et l'arborescence sont conservées.

## Preuves exécutées
- Avant correction :357/357Node sur stable ; parcours complet HTTP/SQL avec fournisseurs simulés, sur accueil/réservation/app. Archive Git340fichiers extraite et contrôlée :40JS valides,64prestations ; objet de tag reconstruit par git mktag avec SHA identique.
- Après correction :**381/381tests Node**, dont24nouveaux cas ; check41JS valides/64prestations ; git diff --check sans défaut.
- Nouveau `tests/melba-clarifications-browser.cjs` : Chromium réel local, `/`1440x1000, `/reservation.html`820x1180, `/app/`390x844. Jour seul→mois→année, reload entre réponses, zéro calendrier avant précision ;4doigt14€/20min ;14h ; coordonnées fictives privées et récapitulatif restauré ; multiGel+6doigts73€/120min ;3doigts refusé puis2doigt accepté. Zéro écriture ou appel fournisseur.
- Scripts navigateur date-courte et refus-mois :3interfaces chacun, refus répétés, mise en pause/reprise, clarification et changements de mois, conservation privée. Tous passent.
- Date-horaire navigateur :3interfaces, vrais handlers et SQL PGlite ; changement de date aux étapes période/horaire, entier14h, récapitulatif à la nouvelle date,100min/59€,purge, annulation.3réservations **locales seulement** ; dimanche fermé et pause13–14h bloqués.
- Suite navigateur générale : ordinateur/tablette/téléphone/paysage, crâne et multi-sélection, réservation et annulation simulées, Manager, coexistence workers PWA, actualisation JS et absence API/vidéos en cache : réussie, zéro erreurJS. Les données Manager et fournisseurs y sont simulés.
- SQL isolé : RLS/RPC, concurrence, durées cumulées, Paris été/hiver, file pauses et verrous : tous passent. Rappels24h, déplacement/annulation/obsolescence/reprise après crash : passent en simulation.

Les tests existants qui supposaient un mois/une année ont été adaptés à la nouvelle exigence explicite, sans retirer leurs assertions sur refus, calendrier,14h, conservation des informations et récapitulatif. Les fixtures sont datées24octobre2026 pour reproductibilité.

## Limites
Pas de nouvel essai physique Android/iPhone, pas de nouvelle réservation de production ni notification/événement réel. Les fournisseurs Supabase/Outlook/Resend/Brevo sont couverts localement par simulation/SQL isolé ; leur réussite opérationnelle actuelle provient du test réel rapporté par le propriétaire sur la stable. Aucun changement de leurs intégrations. Le nouveau comportement n'est PAS en ligne, donc aucune validation publique du correctif revendiquée.
Aucun contrôle intégral de lecture des vidéos dans cette mission ciblée ; médias non modifiés. Le tag distant et sa protection nécessitent une authentification/droits GitHub adaptés ; ne pas demander de clé ou secret dans une conversation. Sauvegardes de données/services externes non réalisées ni garanties.

## Livraison / revue
Branche `fix/20261024-melba-clarifications` issue exclusivement de4960ca8. SHA exact et numéro de PR dans le commentaire de transmission GitHub (pas de SHA autoréférentiel dans ce rapport).
Revue Claude demandée : clarification hors contexte, contexte explicite et mois/année partiels, aucune disponibilité anticipée,14h, toutes variantes doigts et ambiguïtés,64prestations/cumuls, refus/reload/confidentialité/purge. Après verdict, **attendre l'autorisation explicite du propriétaire avant toute fusion/déploiement**.
Production inchangée. Work s'arrête après publication vérifiée ; aucun réveil automatique de Claude.
