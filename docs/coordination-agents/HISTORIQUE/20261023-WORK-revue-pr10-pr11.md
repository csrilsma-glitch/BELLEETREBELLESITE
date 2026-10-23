# CW2-INT-010-011 — Revue Work

Auteur WORK ; 23 octobre 2026, 22:00 Europe/Paris. Niveau CW 2, limité à cette mission. Budget : une suite Node complète exécutée (202 tests), un scénario navigateur ciblé, zéro déploiement applicatif.

## Périmètre et références
PR #10 : c726e49b962d0120fc77541f18cf749b14d0b022. PR #11 : 249f7ddfbae85ca229a669f640ab4beb6820251e. Base main 9d688d838c937c8946d61310f254196b85cfb1c6 ; référence sauvegardée backup/main-pre-cw2-pr10-pr11-20261023. Aucun travail simultané observé sur ces têtes lors de la revue. Les deux transmissions différentes ont été lues et archivées séparément.

## PR #10 — BLOQUÉE, ni fusion ni déploiement
202/202 tests Node réussis indépendamment ; ce résultat ne suffit pas à valider la minimisation.

### ANO-CW10-001 — noms conservés, preuve reproductible
Fichier site/melba-session.js, cleanHistory/pack : CONTACT ne filtre que e-mail/téléphone. Un message « Je m’appelle Cliente Fictive » ou « Cliente Fictive » est conservé. Reproduction minimale : pack({history:[{role:'user',content:'Je m’appelle Cliente Fictive'}]}) contient encore le nom. Confirmé dans sessionStorage et dans les bulles restaurées après reload de /app/. Aucun nom réel utilisé.
Attendu : ne pas persister les noms ni autres coordonnées, y compris noms libres après demande du serveur et messages assistant qui les répètent. Recommandation : état de réservation strictement autorisé et historique minimisé/expurgé ; ne pas casser les signatures des messages assistant puis les renvoyer comme valides. Ne pas promettre qu'une simple regex supprime toute donnée personnelle libre.

### ANO-CW10-002 — purge immédiatement correcte, mais historique ressauvé
Fichier site/assistant.js : clear() supprime la clé après réservation, mais history/bookingContext restent en mémoire. Reproduction navigateur : nom fictif → récapitulatif simulé → bouton Confirmer vers endpoint simulé → clé absente → « Merci » → persist() ressauve l'ancien historique et le nom. Confirmé sans aucune requête vers les fournisseurs réels.
Attendu : purge durable de l'état persistant ET du contexte de conversation utile après succès ; le prochain message ne doit pas reconstituer l'ancienne identité/proposition. Conserver le résultat visible et le lien de gestion uniquement selon les règles existantes, sans le mettre en cache.

### Couverture PWA et expiration
L'affirmation « /app/ ne charge pas assistant.js, donc non couvert » est incomplète. site/app/index.html contient iframe#site src='../?source=pwa'. Cette page embarquée charge melba-session.js AVANT assistant.js dans index.html. reservation.html charge aussi les deux scripts ; le Manager ne les charge pas. Test Chromium 153, viewport 390x844, vraie coque /app/ locale, rafraîchissement du parent : service, messages et contexte sont restaurés dans l'iframe. Donc pas de nouvelle fonctionnalité /app/ à développer pour résoudre ce faux diagnostic ; corriger la documentation. Android installé physique non testé.
TTL déterministe : pack avec horloge fixée, avant 30 minutes restauration possible, après 30 minutes retour null ; load purge lors de la prochaine lecture. Pas de minuterie de suppression automatique pendant une page laissée ouverte. TTL glissant à chaque sauvegarde. Purge immédiatement après succès simulé vérifiée, avec défaut de re-sauvegarde ci-dessus.
Le nouveau module n'est pas ajouté au SHELL du worker racine : sa disponibilité hors connexion ne doit pas être affirmée sans test. Aucun changement offline demandé à Claude dans cette revue.

## PR #11 — VALIDÉE pour intégration documentaire
CW1 par défaut, CW2 limité à l'objectif puis arrêt, CW3 NON ACTIVE sans orchestrateur ; rôles et autorisations sensibles préservés. AGENTS.md/CLAUDE.md renvoient vers les règles. Modèles relus. Petit défaut documentaire corrigé par Work : les statuts du modèle mission reprenaient les anciens A_FAIRE/A_VERIFIER_WORK ; alignement sur la liste officielle du protocole. Aucun changement applicatif. Archives antérieures préservées et transmissions concurrentes conservées.
Fusion documentaire avec [skip netlify] uniquement. Le résultat définitif et son SHA sont traçables dans PR #11 et dans le rapport utilisateur ; aucun déploiement applicatif nécessaire.

## Tests réellement exécutés et limites
- node --test /tmp/br-cw10/tests/*.test.js : 202 pass / 0 fail.
- Navigateur ciblé local, Chromium 153, mobile simulé 390x844 : iframe /app/, restauration, fuite de nom, purge au clic simulé, re-sauvegarde au message suivant ; TTL module avec horloge déterministe.
- Tous les endpoints de notification/booking réels remplacés par routes locales fictives ; aucun rendez-vous, e-mail, SMS, événement Outlook ou donnée cliente réels créés/modifiés.
- Pas de nouveau SQL réel, de changement de paramètres ou de tests fournisseur. Les preuves SQL antérieures demeurent datées, sans être déclarées réexécutées ici.
- Production constatée avant intégration : ccd4ed4, deploy Netlify 6adb33732ee47b285459e856, ready. Le commit main documentaire est distinct du code réellement publié.

## Suite proposée
CW-003-R1, CLAUDE, EN_ATTENTE_VALIDATION : corriger ANO-CW10-001/002 dans la PR #10, ajouter les régressions navigateur et corriger la limite /app/ dans la transmission. Ne pas ajouter d'autres fonctionnalités ni toucher aux tarifs/sécurité/intégrations. Fournir preuves avant/après, absence de coordonnées dans storage, expiration et purge durable ; Work reprend ensuite uniquement sur autorisation. Cycle 1/3 pour ces deux anomalies. Aucun lancement automatique.
