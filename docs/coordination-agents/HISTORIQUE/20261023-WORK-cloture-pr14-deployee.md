# RAPPORT CW3 — clôture finale Work — 23 octobre 2026, 23:19 Europe/Paris

## Résultat
PR #14 fusionnée et correctif publié en production avant 23h30. Claude : df568b4a10482d099d4cc1e44e25703a993d8123. Work : intégration 27f560ef146aa9c6dd448cf1e5db6535e30091ee puis fusion **6790096e693c23d2e81a31048838cb303d8f1678**.
Netlify existant belleetrebelle-nailstudio / 93027859-2254-4471-b9b6-cfad17f470aa : déploiement **6adbce1f79c773577ebfd797**, contexte production, main, ready, publié 2026-10-23T21:14:21.627Z, SHA exact 6790096e693c23d2e81a31048838cb303d8f1678.
URL officielle https://belleetrebelle-nailstudio.fr/ ; PWA cliente https://belleetrebelle-nailstudio.fr/app/.
Retour arrière préparé : backup/main-pre-cw3-pr14-20261023 = 1dd4ee43904dd634abd03a496a1c120a31dbdce6 ; application précédente ccd4ed4bb8e974acd6f600b4eb3b4added72cbf7 / Netlify 6adb33732ee47b285459e856. Incident éventuel : revert ciblé + redéploiement, sans modifier les données.

## Corrections vérifiées
Collecte des coordonnées explicitement privée et collante jusqu'à purge ; nom minuscule et réponses ultérieures qui le répètent exclus de la mémoire persistante. Historique ordinaire et contexte de réservation restaurés après rafraîchissement ; durée limitée à 30 minutes selon TTL du module. Après confirmation réussie, historique et contextes en mémoire ET stockage vidés ; Merci ne réinjecte rien.
Pages couvertes : index.html, reservation.html, /app/ via son iframe vers le site. Pas de nouveau client parallèle.
Conflits documentaires résolus sans écraser main : arbre construit sur main, seuls fichiers applicatifs/tests identiques à df568b4 copiés ; variantes anciennes de coordination archivées. Aucun changement à d8024eb pour avertissement de signature. Aucun changement aux fonctions serveur, tarifs, données clientes, secrets, Manager ou règles MFA.
PR #10 remplacée par #14 ; GitHub peut la marquer merged par inclusion de son ascendance dans #14 ; pas de fusion ou déploiement séparé. PR #7 et #8 inchangées.

## Tests réellement exécutés par Work
- npm test : **210/210**, 0 échec.
- npm run check : 39 fichiers JavaScript valides, 64 prestations conservées.
- SQL isolé PGlite : toutes les migrations et assertions passent, dont concurrence, double réservation refusée, idempotence, droits anonymes, cumul prix/durée, changement tarif non rétroactif, déplacement, pauses et rappels. Aucune base réelle utilisée.
- Rappels simulés : email/SMS24h, déplacement, obsolescence, annulation répétée, délai24h et reprise après crash : OK.
- Chromium153 local, 390x844, réseau fonctions simulé : sur accueil, réservation et vraie iframe /app/, nom minuscule absent ; conversation ordinaire restaurée ; répétition du nom à un tour ultérieur exclue ; confirmation fictive puis purge et Merci sans réapparition ; TTL déterministe avant/après30min : OK.
- Le harnais reservation utilisait initialement un sélecteur checkbox ambigu ; restriction à assistant-log et relance réussie. Lancement SQL initial sans NODE_PATH : module PGlite absent du worktree, corrigé par réutilisation de la dépendance locale existante, puis succès. Ces incidents d'environnement ne sont pas des défauts applicatifs.
- Téléchargement HTTPS du module publié : SHA256 identique au fichier validé : 93c1336cd5148e5c1aa103d2904451aabcd46ec26b2d17423e57ccd4f7b4498a.
- Navigateur cloud réel, B&R APP publiée : demande Kit press on nails complet uniquement -> demande date/préférence ; rafraîchissement -> conservation demande et réponse ; 27 octobre2026 à10h40 -> mardi et30min, demande coordonnées ; coordonnées totalement fictives puis nom explicite -> **récapitulatif25€/30min**, bouton Confirmer présent, message aucun rendez-vous enregistré. **Aucun clic Confirmer réel**.
- Nouveau rafraîchissement production : historique avant collecte restauré ; nom, téléphone, e-mail fictifs et récapitulatif absents de l'affichage restauré. Coque /app/ et Melba accessibles après déploiement.
- Chromium local direct vers Internet bloqué par configuration réseau/TLS du runtime ; la vérification réelle a été réalisée dans le navigateur cloud sans contournement de certificat.

## Limites et réserves
Aucun rendez-vous réel ni SMS/e-mail/événement Outlook de test créé. Le clic final et fournisseurs réels ne sont donc pas certifiés de bout en bout par cette mission ; ils restent couverts ici par simulations et SQL isolé uniquement. Android/iPhone physiques non testés. Cette livraison ne certifie ni toute l'exploitation ni la conformité juridique/sécurité antérieure.
Après début collecte, tous messages suivants restent privés et ne sont volontairement pas restaurés : les coordonnées peuvent devoir être redonnées après un rafraîchissement. Hors collecte explicite, la détection universelle d'un nom spontané n'est pas garantie ; ne pas prétendre filtrer toute information personnelle libre. Pas de stockage durable inter-appareils ni de nouvelle promesse hors ligne.
Observation réelle non bloquante : nom mélangé sans formule à téléphone/e-mail a été redemandé ; une formulation Je m'appelle… permet le récapitulatif correct. Pas de nouveau correctif serveur dans ce périmètre.
Les mentions historiques affirmant /app/ non couvert ou les anciennes limites de chaque cycle restent des archives ; le présent rapport actualise ces constats.
L'orchestrateur reste absent et hors périmètre. Aucune nouvelle mission n'est lancée.

## Clôture
Objectif de ce correctif atteint et publication SHA confirmée. Prochain détenteur : PROPRIÉTAIRE. Les propositions indépendantes restent EN_ATTENTE_VALIDATION.
**MELBA DÉPLOYÉE — SHA CONFIRMÉ — BALLE AU PROPRIÉTAIRE — MISSION TERMINÉE.**
