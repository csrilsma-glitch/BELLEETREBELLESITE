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
