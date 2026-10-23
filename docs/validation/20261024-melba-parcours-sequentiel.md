# Melba — parcours séquentiel déterministe

Mission directe du propriétaire à Work, après clôture CW3 : développement, tests, intégration et production autorisés sans relais Claude. Base main2479b2270eb98290010890b1cc0c6a92643afddc, application6790096. Aucun ancien ZIP.

## Cause et correction
La reconstruction des coordonnées depuis vingt messages et le recours au modèle pour des transitions métier entraînaient des questions groupées, répétitions et oubli de noms. Le nouveau client envoie flow_version2. melba-flow.js pilote les étapes : prestation(s), date seule, vérification des créneaux, période disponible, horaire, nom de famille, prénom, e-mail, téléphone, récapitulatif. Les informations temporelles déjà fournies sont validées sans être redemandées. Les conseils/réclamations continuent d'utiliser Claude et ses outils existants ; personnalité, avatar et présentation conservés.
Les prix/durées et prestations actives proviennent du catalogue Supabase courant et du devis SQL. Le calendrier natif est interrogé avant les périodes proposées, au choix d'heure et au récapitulatif. La confirmation reste exclusivement un bouton explicite avec consentement, via l'endpoint natif existant et son insertion atomique/idempotente. Aucun acompte.

## Confidentialité et sécurité
Contexte métier minimal signé, sans coordonnées, restaurable avec la mémoire de conversation. Les coordonnées sont séparées dans br15_melba_flow : cookie chiffré AES256GCM côté serveur via la clé existante, HttpOnly, Secure, SameSiteStrict, Path /.netlify/functions/, expiration absolue30min depuis le début de parcours et liaison à un identifiant de parcours signé. Pas de donnée personnelle en clair dans sessionStorage, ni de jeton privé accessible au JavaScript. Suppression du cookie après succès ou abandon. Les signatures, autorisations, limites, protections anti-concurrence, Manager et MFA ne changent pas. Aucun nouveau secret ni migration réelle.
Les préfixes de champs sont acceptés ; une correction explicitement demandée ne réinitialise pas les autres champs. Une ancienne session publique est migrée sans déduire de coordonnées depuis son historique. Cookie d'un autre parcours, expiré ou altéré : non réutilisé. Hors collecte, la détection universelle d'informations spontanées reste une limite de l'historique libre déjà documentée.
Le service worker public reçoit une version nouvelle et inclut le module de session ; aucune API ou donnée privée ajoutée au cache. Le Manager et son service worker restent distincts et inchangés. La page cookies décrit le nouveau mécanisme fonctionnel sans modifier les réserves juridiques existantes.

## Tests exécutés avant publication
- 223/223 tests Node (13 nouveaux scénarios du gestionnaire HTTP réel, modèle non appelé pour le parcours).
- npm run check : JavaScript valide,64prestations conservées ; git diff --check sans erreur.
- SQL PGlite : migrations et suite existante passent, prix/durées, chevauchements, concurrence, idempotence, déplacement, annulation, RLS, rappels et pauses.
- Rappels simulés :24h, déplacement, obsolescence, annulation et reprise après crash passent.
- npm run test:melba-flow : Chromium153 avec HTTP réel chat/catalog/reservations et migrations PGlite locales. Accueil1440x1000, réservation820x1180, PWA/app390x844 : parcours complet, cookie protégé, rafraîchissement entre nom et prénom, absence des coordonnées en sessionStorage, clic explicite, insertion SQL réelle locale, purge, six tâches créées et livrées en simulation, annulation locale. Trois réservations jetables au total. Dimanche fermé et pause13h–14h vérifiés par SQL. Toute sortie réseau fournisseur des fonctions est interdite dans cette recette.
- Un premier essai isolé avait laissé core.rate utiliser son accès DB encapsulé : absence de référence préproduction. Le harnais a été corrigé pour diriger aussi la limitation vers le PostgreSQL local. Aucun réglage de production assoupli.

## Reproduction
npm ci, puis npm test ; npm run test:sql ; npm run test:reminders. Pour la recette Chromium : BROWSER_EXECUTABLE pointant vers Chromium compatible, npm run test:melba-flow. Dans l'environnement Work, dépendances existantes réutilisées via NODE_PATH ; aucune dépense ni nouvelle dépendance.
Les scénarios unitaires ont une horloge métier fixée au23octobre2026. Le navigateur choisit une date future ouvrée dynamiquement. Aucune clé réelle ni donnée cliente dans les fixtures.

## Intégrations constatées en lecture seule
Supabase production :64prestations actives, réservation/e-mail/confirmation SMS activés ; rappel SMS désactivé (réglage préservé). Outlook sélectionné, dernier indicateur lu21:55:13UTC le23octobre2026, sans erreur enregistrée. File historique sans failed/uncertain dans l'agrégat observé. Resend : domaine vérifié, envoi activé, suivi ouvertures/clics désactivé.
Ces indicateurs et les simulations ne constituent pas une preuve de réception réelle actuelle. Aucun SMS/e-mail réel, événement Outlook ou réservation réelle créé pendant la mission. Pas d'accès Brevo indépendant pour certifier le solde ou la délivrabilité.

## Publication et contrôle réel
Le SHA, l'identifiant Netlify et les contrôles du site publié seront consignés dans la clôture Work et dans la PR. Aucun appareil Android/iPhone physique utilisé ; simulation mobile et vraie coque/app testées. Le clic final en production est volontairement exclu pour ne pas créer de rendez-vous ou notification réels de test.
