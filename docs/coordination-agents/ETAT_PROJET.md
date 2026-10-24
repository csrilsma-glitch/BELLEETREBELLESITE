# État vérifié — Belle & Rebelle

Mise à jour : 23 octobre 2026, 21:34 Europe/Paris, Work. Les observations sont datées, pas des garanties permanentes.

## Production et GitHub
- Main et production réellement publiée : `ccd4ed4bb8e974acd6f600b4eb3b4added72cbf7`, fusion de la PR #6 (correctif nom seul, Claude `098f2e5`).
- Netlify existant : belleetrebelle-nailstudio ; déploiement `6adb33732ee47b285459e856`, ready, publié le 23/10 à 12:14:29 Paris.
- URL : https://belleetrebelle-nailstudio.fr ; cliente /app/ ; Manager /manager/.
- PR #7 : `6bf3a31`, correction de reconnaissance « babyboomer 2 doigts », NON FUSIONNÉE et NON DÉPLOYÉE.
- PR #8 : protocole CW initial, `13ca0b1`, NON FUSIONNÉE. Conservée intacte ; nouvelle installation documentaire séparée.
- L'installation documentaire peut avancer main sans changer le dernier SHA applicatif publié ci-dessus ; ne pas les confondre.

## Faits vérifiés
- Le propriétaire a confirmé sur Android le parcours jusqu'au récapitulatif après PR #6. Cela ne prouve pas une création réelle ni la livraison des notifications.
- Work CW-002 : PR #7 relue, 195 tests Node réussis ; les deux tests de régression échouent sur main et passent sur le correctif.
- Interface B&R APP en Chromium 153, mobile simulé 390 px et gestionnaire HTTP réel local : bb-2 → date → Matin → 10h40 → coordonnées fictives → récapitulatif 7 €/10 min ; aucune écriture. Calendrier et modèle simulés, pas une preuve en production.
- Tests SQL PGlite, rappels et contrôles de fichiers réussis. Suite navigateur ordinateur/tablette/mobile/paysage réussie ; deux workers PWA séparés et purge de cache vérifiés localement. Lecture initiale des 12 MP4 originaux réussie, sans copies WebM ; pas de visionnage intégral sur appareil physique.
- Supabase production consulté uniquement en lecture : 64 prestations actives ; réservation activée ; email activé ; confirmation SMS activée ; rappel SMS désactivé ; Outlook requis.
- Connexion Outlook : calendrier sélectionné, aucune erreur enregistrée, last_sync au 23/10/2026 21:30:15 Paris. C'est un indice de santé, pas une nouvelle preuve de création/modification/suppression réelle.
- File notifications : tâches historiques email/SMS/Outlook marquées sent ; pas de tâche failed/uncertain dans l'agrégat lu. Un rappel email pending peut être normal, son échéance n'a pas été inspectée. sent ne prouve pas la réception.
- Resend : domaine vérifié, envoi activé, région eu-west-1 ; tracking ouvertures et clics désactivé. Aucun envoi réalisé.

## Défauts et limites
- CW-003 : perte de conversation après rafraîchissement REPRODUITE dans /app/ ; historique et contexte dans la mémoire de site/assistant.js. Correction non réalisée.
- Nom demandé parfois deux fois : signalement utilisateur, pas reproduit dans le scénario indépendant ; finition à proposer, pas blocage majeur établi.
- Pas d'accès Brevo connecté disponible : solde, délivrabilité et état du compte non certifiés. Code de simulation et contrôles d'envoi relus ; SMS historique sent seulement observé côté application.
- Confirmation, écriture Supabase, synchronisation Outlook et réception des notifications non retestées de bout en bout sur services réels. Aucun événement, rendez-vous ni message réel déclenché.
- Aucun test physique Android/iPhone pendant cette intervention ; aucune nouvelle session Manager personnelle utilisée.
- Réserves juridiques et de sécurité précédentes non résolues par ce travail documentaire.

## Priorité et suite
Proposer à Claude la préparation d'une validation complète isolée du clic Confirmer jusqu'à Supabase/Outlook/notifications, sans envoi réel, puis soumettre tout essai réel séparément. Statut EN_ATTENTE_VALIDATION. Ne pas déclarer Belle & Rebelle intégralement validée.

## Niveau d'autonomie courant (23/10/2026, Claude)
- Niveau CW actif : **CW 1** (défaut, aucune commande de niveau reçue pour la mission en cours).
- Orchestration automatique CW 3 : **NON ACTIVE**. Aucun service ne surveille GitHub.
- Règles : `NIVEAUX_CW.md`.

## Mise à jour Work — CW2-INT-010-011, 23/10/2026 22:00 Paris
Cette section courante prime sur les mentions d'état historiques ci-dessus. Niveau de cette mission : **CW 2**, arrêt après rapport. CW 3 **NON ACTIVE**, aucun orchestrateur.
- PR #10 / c726e49 : **BLOQUÉE** pour confidentialité (nom persistant, historique ressauvé après purge). 202 tests Node verts mais garanties non remplies. Aucun déploiement ni fusion.
- /app/ charge le client indirectement par iframe vers /?source=pwa : restauration vérifiée en Chromium mobile simulé, pas sur Android physique. Ne pas présenter /app/ comme absent du périmètre.
- PR #11 / 249f7dd + consolidation documentaire Work : règles validées, intégration documentaire autorisée et exécutée dans ce cycle ; modèle des statuts harmonisé, historique préservé. Voir PR #11 pour le SHA de fusion.
- Dernier code applicatif publié inchangé : ccd4ed4 ; deploy 6adb33732ee47b285459e856. Aucun nouveau commit applicatif déployé pendant cette mission.
- Prochaine proposition : CW-003-R1, CLAUDE, EN_ATTENTE_VALIDATION. Aucun agent lancé automatiquement. Détails : HISTORIQUE/20261023-WORK-revue-pr10-pr11.md.

## CW3-T02 — Work — 23/10/2026 22:29 Paris
État courant : lire ETAT_BALLE_CW.md. Essai CW 3 avant 23:00, aucun orchestrateur ni fréquence cinq minutes installés. Balle CLAUDE à la publication de cette intégration documentaire.
- PR #10 HEAD 666b005 : purge durable validée ; nom seul encore stocké/restauré. Déploiement bloqué, aucun changement applicatif en production.
- 12 tests ciblés et scénario navigateur isolé exécutés. Aucun nouveau SMS, email, rendez-vous ou événement réel.
- PR #12 : règle et suivi de balle documentaires ; aucune modification du code métier.
- Dernière production applicative connue inchangée : ccd4ed4 / deploy 6adb33732ee47b285459e856 ; pas requalifiée comme validation intégrale du site.
- Même mission CW-003-R1 autorisée à continuer dans cet essai, uniquement correction résiduelle avant l’échéance ; pas une nouvelle fonctionnalité ni mission.

## Clôture CW3-T04 — Work — 23/10/2026 22:47 Paris
Cette section est courante ; les sections précédentes restent historiques. Balle finale PROPRIÉTAIRE, essai clos sur blocage.
- PR #10 HEAD 50acd7f : 14 tests ciblés réussis, mais nom en minuscules après demande de coordonnées stocké et restauré dans /app/ (preuve Chromium isolée). Cycle 3/3, arbitrage requis ; ni fusion ni déploiement.
- Purge après réservation toujours corrigée, y compris nouveau message. Aucune notification ou réservation réelle pendant les contrôles.
- Proposition PROPOSITION_ORCHESTRATEUR_GITHUB.md publiée : architecture seulement, aucune installation/secrets/agent actif. Alternative Codex CI distincte de ce chat Work.
- Dernier code applicatif publié connu inchangé : ccd4ed4 / deploy 6adb33732ee47b285459e856 ; aucun commit applicatif de cette mission déployé.
- Aucune nouvelle mission autorisée automatiquement ; propriétaires décident de l'arbitrage confidentialité et du pilote d'orchestration.


## Actualisation finale — 23/10/2026, 23:19 Paris
PR14 fusionnée et production publiée : 6790096e693c23d2e81a31048838cb303d8f1678, Netlify6adbce1f79c773577ebfd797 ready. Mémoire de session et collecte privée validées ; 210Node, SQL, rappels et Chromium local réussis. B&R APP réelle vérifiée jusqu'au récapitulatif25€/30min, sans confirmation. Rafraîchissement conserve l'historique ordinaire et exclut les coordonnées. Limites et preuves : HISTORIQUE/20261023-WORK-cloture-pr14-deployee.md. PR10 remplacée ; PR7/8 restent hors mission. BALLE AU PROPRIÉTAIRE, mission TERMINÉE.


## 24octobre2026,00:14Paris — finalisation directe Work TERMINÉE
Production **6ad1ec023cd1fd6c047f31d039d60930fbd13cc2**, Netlify6adbdb70a378c9c715fa1954 ready (PR16/17). Parcours séquentiel, coordonnées chiffrées séparées, restauration/purge et récapitulatif corrigés. 224Node, SQL/rappels et navigateur isolé trois formats réussis ; contrôle domaine officiel jusqu'au récapitulatif et après reload, aucun clic final réel. Informations complètes : docs/validation/20261024-melba-parcours-sequentiel.md. Aucun changement données réelles, secrets, prix, Manager ou MFA. Mission sans nouveauCW ni relais, aucune opération supplémentaire attendue de Claude.


## MELBA-PERIOD-001 — 24octobre2026 — Work
État avant publication : production ffa36c7/Netlify6adc02b451f95fe7304fd2ea. Bug de refus de période reproduit publiquement. Correctif ciblé validé localement :332Node, navigateur3formats, parcours HTTP/SQL complet isolé. Fusion et un déploiement expressément autorisés ; EN_COURS. Rapport docs/validation/20261024-melba-autre-date.md ; preuves de publication à compléter dans la clôture GitHub. Aucun rendez-vous/message réel, tarif ou sécurité modifié.


### Clôture MELBA-PERIOD-001
PR20 fusionnée, production b4ee16cb21dc7499497de59f21b423806446b812, Netlify6adc0df1ec183b0f27999cf5 ready,03:46:41Paris. Refus du matin et recherche27/28/29octobre vérifiés sur3pages publiques ; date27revérifiée sur accueil.332Node et recettes isolées réussis. TERMINÉE, aucune réservation/notification réelle. Rapport20261024-melba-autre-date.md.


## MELBA-DATE-SHORT-001 —24octobre2026
«Le26» ignoré : corrigé/testé uniquement sur branche fix/20261024-melba-date-courte ;341Node + navigateur3interfaces. NON FUSIONNÉ/NON DÉPLOYÉ à la demande du propriétaire. Production resteb4ee16c. Voir docs/validation/20261024-melba-date-courte.md.
