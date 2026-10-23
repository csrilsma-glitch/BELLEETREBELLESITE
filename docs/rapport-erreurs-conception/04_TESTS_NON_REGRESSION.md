# Tests de non-régression réellement exécutés

Date : 23 octobre 2026. Linux, Node 24.19.0, Playwright 1.62.1, Chromium 153.0.8010.0 ; PGlite local. Données fictives uniquement. Les sorties sont dans `preuves/`.

| Commande | Résultat | Portée |
|---|---|---|
| `npm test` | 158/158 réussis | Dont dix nouveaux tests Melba : dates, préférences, abandon, liens d’annulation, heures inventées, multi-prestations, alternative, créneau occupé, panne, contexte signé/falsifié |
| `npm run check` | Réussi | Syntaxe et 64 prestations conservées |
| `npm run test:sql` | Réussi | Prix/durées cumulés, horaires/pauses/congés, collision, idempotence, annulation réelle locale, déplacement, tarifs historiques, RLS/RPC, Paris été/hiver |
| `npm run test:reminders` | Réussi | Rappels 24 h, déplacement, obsolescence, annulation répétée, reprise ; aucun fournisseur réel |
| `npm run test:browser` | Réussi | Quatre viewports : 1440×1000, 820×1180, 390×844, 844×390 ; crâne, multi-prestations, annulation, Manager, 64 prestations, confirmation explicite Melba simulée |
| même suite navigateur | Réussi | Lecture des 12 MP4 originaux, navigation/relecture/pause/erreur-réessai, coexistence des workers public/B&R APP/Manager, anciens caches et absence API/vidéos en cache |
| `npm run test:manager` | Réussi | Cinq configurations : ordinateur, mobile autonome simulé, mobile navigateur, paysage et ancien matchMedia ; notes, périodes, confirmations |
| `npm run test:targeted-ui` | Réussi | 96 créneaux sur 390/820/1440 px ; menu compact, clavier, total 105 minutes, choix invalidé, Markdown/HTML sûr, ancienne proposition désactivée, déplacement Manager |

Les assertions existantes de navigateur sont adaptées au nouveau select sans supprimer les scénarios de réservation/annulation. Le test de cache attend désormais la suppression des deux anciennes versions présentes dans sa fixture.

## Limites

- Pas d’appel réel Anthropic, Outlook, Resend ou Brevo ; aucune consommation de SMS ou d’envoi de test.
- Les réponses Claude adversariales sont simulées. Pas de mesure du comportement statistique du vrai modèle sur de nombreuses conversations.
- PGlite est un moteur SQL local, pas un test de charge multi-processus du PostgreSQL hébergé. Le test de collision local ne remplace pas cette dernière preuve.
- Aucun téléphone physique, Safari/WebKit ni Edge distinct testé. Les tailles mobiles et le mode installé sont simulés dans Chromium.
- Aucun test ni déploiement de cette branche sur le site officiel ; les corrections y sont donc **non publiées**.
- Les tests de course ajoutés doivent être relancés après toute modification du séquençage des réponses ou des recherches.

## Reproduction locale

`npm ci --ignore-scripts`, puis les commandes ci-dessus. Installer Chromium avec Playwright ou définir `BROWSER_EXECUTABLE` vers un Chromium compatible. Aucun secret réel n’est nécessaire. Les tests utilisent des ports localhost distincts et des prestataires simulés.

## Avant fusion, pour Claude

Relire les conditions de garde-fou, tester les paraphrases adversariales et la mémoire des dates/préférences. Contrôler les réponses tardives. Confirmer que `lib/booking.js`, les migrations et les intégrations n’ont pas changé. La fusion et le déploiement nécessitent une nouvelle validation explicite du responsable.

## Nouvelle exécution après HTN-ERR-066 à 070

168/168 tests Node et toutes les suites ci-dessus relancées avec succès, plus MFA navigateur et récupération. Les sorties actuelles sont dans `preuves-correctifs-066-070/` ; les anciennes sorties `preuves/` documentent exclusivement la première version PR #3. Voir `06_REPONSE_CONTRE_AUDIT_066_070.md`.

## CW-003 — perte de la conversation au rafraîchissement (23/10/2026, Claude)

- **Symptôme (reproduit par Work sur /app/ et par Claude) :** un rafraîchissement de la page efface la conversation de Melba et son contexte de réservation.
- **Cause vérifiée :** l'historique et le contexte signé vivaient uniquement dans la mémoire de `site/assistant.js`.
- **Correction :** `site/melba-session.js` conserve, dans `sessionStorage` (propre à l'onglet), le texte des 20 derniers messages et le contexte signé, pour 30 minutes au plus. Un message contenant un e-mail ou un numéro n'est jamais stocké ; les propositions cliquables ne sont pas stockées ; la mémoire est purgée après une réservation réussie ; un stockage indisponible désactive simplement la mémoire.
- **Non-régression :** `tests/melba-session.test.js`, 9 tests verts ; `npm test` 202/202 ; `npm run test:sql` 100 % vert (concurrence, double clic, clé forgée, rappel unique, annulation).
- **Limites :** le client de `/app/` (`site/app/index.html`) ne charge pas `assistant.js` ; la correction s'applique aux pages qui chargent Melba (accueil et réservation). Le stockage est propre à l'onglet, pas à l'utilisateur : un changement d'utilisateur dans le même onglet n'est pas détecté. Aucun test sur navigateur réel ni appareil physique.
- **Détection future :** le test « index.html et reservation.html chargent melba-session.js avant assistant.js » échoue si la dépendance est retirée.

## CW-003-R1 — corrections demandées par Work (PR #10)

- ANO-CW10-001 (noms conservés) : un nom annoncé par « je m’appelle », « mon prénom est », « mon nom est », « je suis », « nom : » ou « prénom : » est retenu ; tout message le contenant, y compris une réponse de Melba qui le répète, n’est plus stocké (`site/melba-session.js`, `cleanHistory`). Tests : `tests/melba-session.test.js`, 2 régressions.
- ANO-CW10-002 (mémoire après purge) : après réservation réussie, `site/assistant.js` vide l’historique et remet `bookingContext`/`contextSignature` à null avant `clear()`, sans réinjecter de message. Test de source sur la branche de succès.
- Correction de test préexistante : l’horloge de test était figée à 20:00Z alors que `save()` horodate avec l’heure réelle ; les états sauvés paraissaient futurs et étaient rejetés.

Limites : un nom donné seul, sans formule introductive, n’est pas détecté ; un mot suivant « je suis » (ex. « je suis fatiguée ») est aussi retenu, ce qui écarte des messages en trop (minimisation par excès, sans effet sur la réservation). Aucun test navigateur réel dans cette correction ; le module est testé avec un sessionStorage factice. Aucune donnée réelle, aucune réservation, aucune notification.

## CW-003-R1 (cycle 3, prolongation du propriétaire jusqu’à 23h30) — collecte explicite

- AutoDiag ANO-CW10-001 (reliquat) : un nom seul, donné après une demande de nom ou de coordonnées, était conservé. Correction : collecte explicite. Si la réponse de Melba demande un nom, des coordonnées, un téléphone, un e-mail ou une adresse, le message suivant de l’utilisateur et la réponse de Melba qui y répond sont marqués privés et ne sont jamais persistés (`isCollecting`, `persistable`, `site/assistant.js`). L’état de collecte est sauvegardé pour survivre au rafraîchissement.
- Tests : `tests/melba-session.test.js` 16/16 ; `npm test` 209/209.
- Vérification navigateur simulée (Chromium, viewport 390×844, réponses fictives, aucune fonction réelle) : `index.html`, `reservation.html` et l’iframe de `/app/` : nom absent du stockage et de l’affichage, conversation restaurée après rafraîchissement, demande initiale conservée.
- Limites : un nom donné hors collecte (sans demande préalable de Melba) n’est pas détecté ; la purge après réservation n’a pas été rejouée dans le navigateur ; aucun test avec de vrais services de réservation, notifications ou Outlook.

## CW-003-R1 (cycle 3, reprise après revue Work CW3-T05)

- Défaut reproduit par Work : la collecte se refermait dès qu’une réponse n’avait plus de mot-clé ; un nom en minuscules était alors persisté. Correction : collecte collante (`nextCollecting`) jusqu’à purge après réservation ou expiration de session.
- Tests : `tests/melba-session.test.js` 17/17 ; `npm test` 210/210. Reproduction Work rejouée en navigateur simulé sur `index.html` et `app/index.html` : nom absent du stockage.
- Limite : tant que la collecte est ouverte, les messages suivants ne sont pas restaurés après rafraîchissement (choix de minimisation).


## MELBA-FLOW-001 — questions groupées / reconstruction fragile
Cause vérifiée : coordonnées extraites de l'historique et transitions confiées au texte du modèle. Correction : état déterministe signé, collecte en cookie chiffré séparé de la mémoire ; nom/prénom séparés, périodes/horaires vérifiés, bouton explicite. 224tests Node, SQL et trois parcours HTTP/Chromium isolés avec confirmation et annulation locale. Reprise visuelle initialement décalée reproduite en production : PR17 réaffiche la question non personnelle courante et propose Revoir mon récapitulatif. Régression contexte prérempli sans historique public couverte. Production6ad1ec0 vérifiée jusqu'au récapitulatif sans écriture réelle. Voir docs/validation/20261024-melba-parcours-sequentiel.md pour commandes/preuves/limites.
