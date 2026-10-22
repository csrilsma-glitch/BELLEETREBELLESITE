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
