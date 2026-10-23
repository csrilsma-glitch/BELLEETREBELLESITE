# Clôture Work — CW3-T04 — 23 octobre 2026

Auteur WORK ; contrôle débuté à 22:42 Paris, clôture documentaire préparée à 22:47, échéance 23:00. Niveau CW3 encadré, sans orchestrateur. Autorisation : terminer le contrôle puis étudier l'orchestration, sans installer ni lancer d'agents.

## Mission actuelle : revue 50acd7f
Dernière transmission Claude lue sur docs/balle-cw3 (CW3-T03), distincte de la copie plus ancienne de main et de celle de la branche code. Correctif PR #10 : 50acd7f18219f2659c61bf50fdc72e6b929458a9. Base production applicative inchangée : ccd4ed4.
14/14 tests ciblés melba-session relancés, réussis. Claude annonce 207 tests complets ; cette suite n'a pas été réexécutée inutilement par Work.

**ANO-CW10-001 reste reproduite**, cycle 3/3 : après un message assistant « Pour réserver, indiquez votre nom, téléphone et e-mail. », un nom fictif en minuscules « cliente fictive » est gardé. Le code isBareName impose une majuscule Unicode ; cleanHistory ne traite donc pas cette entrée comme nom seul. Le précédent test majuscule « Cliente Fictive » est désormais correctement filtré.

Preuve module minimale :
```js
const S = require('./site/melba-session');
const history = [
  {role:'assistant', content:'Pour réserver, indiquez votre nom, téléphone et e-mail.'},
  {role:'user', content:'cliente fictive'}
];
console.log(S.pack({history}).includes('cliente fictive')); // true sur 50acd7f
```

Test indépendant dans vraie coque /app/ servie localement, Chromium 153, viewport 390x844, endpoints entièrement simulés : demande de nom puis réponse minuscule → nom dans sessionStorage → nom restauré après rafraîchissement. Ce cas est contextuel, pas la limite « nom sans contexte » évoquée par Claude. Aucun appareil physique utilisé.
**ANO-CW10-002 reste corrigée** : réservation simulée puis « Merci » ne ressauve pas le nom. TTL déterministe avant/après 30 minutes vérifié. Une première exécution du nouveau harnais a échoué sur son attente de texte, corrigée dans le harnais local ; l'exécution vérifiée finale a réussi et confirmé les résultats ci-dessus. Aucun nouveau défaut métier déduit de cet incident de test.

## Décision de contrôle
PR #10 : **BLOQUÉE**, pas de fusion, pas de déploiement. Pas de quatrième cycle lancé : arbitrage du propriétaire conformément à la limite de trois reprises. Recommandation soumise : remplacer la détection heuristique de noms par un état persistant métier autorisé et une séparation de la collecte des coordonnées, si le propriétaire autorise cette suite. Ne pas accepter silencieusement la conservation des noms.
Aucune modification de code applicatif par Work, aucune suppression de données, aucun changement de secrets/sécurité/tarifs, aucun SMS, e-mail, événement Outlook ou rendez-vous réel de test.

## Étude d'orchestration livrée
PROPOSITION_ORCHESTRATEUR_GITHUB.md : architecture événementielle, état machine, contrôleur déterministe, agents CI, lease et concurrence, budget, délai, journal et arrêt ; sources officielles consultées. Une action Claude Code et une action Codex sont documentées ; aucune API publique de réveil de ce chat Work n'a été identifiée. Codex CI serait un intégrateur distinct, sans navigateur/connecteurs ChatGPT hérités.
Un cron GitHub de secours cinq minutes est documenté mais non ponctuel garanti ; rien n'a été installé. Les tâches ChatGPT disponibles sont limitées à une heure ; aucune créée. Premier test proposé avec deux faux agents, zéro IA, zéro secret et zéro production, EN_ATTENTE_VALIDATION.

## Historique du cycle
- Claude : documentation 2790bce, correctifs 666b005 puis 50acd7f ; simulations annoncées et transmissions archivées.
- Work : contrôles ciblés et navigateur, règle de balle intégrée en PR #12 / 310fae7 ; purge durable validée, défaut de nom minuscule confirmé ; proposition d'architecture seulement.
- PR #7 et #8 restent hors mission, non intégrées par cette étape.
- Aucun déploiement applicatif de cette étape. Dernier déploiement connu : 6adb33732ee47b285459e856, SHA applicatif ccd4ed4bb8e974acd6f600b4eb3b4added72cbf7 ; ne pas confondre avec les SHA documentaires main.

## Détenteur final / arrêt
**PROPRIÉTAIRE**, transfert CW3-T04-WORK-OWNER. Objectif applicatif non atteint, statut BLOQUÉE pour arbitrage ; proposition documentaire livrée. Fin anticipée sur blocage avant 23:00 ; aucun agent n'est relancé et aucune opération suivante autorisée.
**MISSION BLOQUÉE — BALLE AU PROPRIÉTAIRE — EN ATTENTE DE DÉCISION.**
