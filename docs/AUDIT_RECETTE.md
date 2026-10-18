# Audit et recette V15 — 19 octobre 2026

## Sources inspectées avant modification

- GitHub `csrilsma-glitch/BELLEETREBELLESITE`, HEAD `050c867a7550701b54bd7f104cff802a95456a24` : clone en lecture, puis branche locale `v15-local`. Aucun push.
- ZIP V14 joint : 70 entrées ; aucun écart de contenu pour les fichiers communs avec `site/` GitHub. Anciens médias supplémentaires du dépôt conservés.
- Trois RAW : identiques aux trois fonctions GitHub. Empreintes SHA-256 :

| Fichier | SHA-256 |
|---|---|
| chat.js | d63d17460be1ff4375919849d6e5e3bdcbb23e8078b1b9f031c554c3a700e820 |
| send-sms.js | 1536550833b03772e284ea1d7db51c1c5a8c8f62c3fb37be888e1538a851f8ce |
| simplybook.js | 0511e7c50982c8e286f365228d13ef1d3a5acfe827276700182f139b39d78d71 |

- Word de transmission lu intégralement (paragraphes et tableaux).
- Cahier des charges Claude : sept pages lues dans la version courante trouvée.
- Arborescence 64 prestations V14 : trois pages lues. Comparaison automatique avec les 64 lignes de l’annexe Word : même ordre, libellés, durées et prix. Identifiants V14 préservés.

## Constats et changements

Le site est statique, publié depuis `site/`. La V14 affiche encore le calendrier externe. Le serveur Melba contient le prompt Claude et trois outils ; il tente des réservations SimplyBook successives avec risque de succès partiel. Son frontend dispose aussi d’un ancien fallback de réponses locales. La fonction Brevo est un test manuel protégé, pas une automatisation de réservation. Aucun backend Supabase ni Manager n’est présent au départ.

Le prompt original et la boucle Claude sont conservés. En mode natif, Melba vérifie via Supabase puis prépare une proposition ; le bouton explicite crée la réservation par le même moteur que le formulaire public. En cas d’erreur Claude, le frontend explique l’indisponibilité, sans substituer un bot simplifié. Les réclamations restent transmises par l’outil original Resend. `send-sms.js` reste inchangé, tandis que les notifications métier utilisent une file dédiée.

Le nouveau moteur comporte catalogue éditable, disponibilité Paris, totaux serveur, réservations multiples atomiques, exclusion des chevauchements, idempotence, congés/pauses, annulation/déplacement par lien signé, ICS et lien Google Agenda. Les tables `br15_*` isolent les migrations du schéma réel non inspecté. Aucune plage horaire n’est supposée. Réservations fermées et SMS désactivés par défaut.

Le Manager comporte connexion Supabase Auth, allowlist UUID et TOTP, agenda jour/semaine/mois, ajouts/déplacements/annulations, fiches et notes, export/anonymisation, catalogue éditable, horaires/congés, préférences, journaux et Outlook. Les vues « semaine/mois » présentent une grille de jours et la liste de la période ; pas de glisser-déposer. Le tableau charge les réservations sur un mois autour de la date choisie et les 1 000 fiches les plus récentes ; une pagination supplémentaire sera nécessaire au-delà de ce volume.

L’intégration Outlook contient OAuth code/state/PKCE, consommation atomique de state, chiffrement des jetons, rafraîchissement, choix d’un agenda dédié et rapprochement périodique. Le site écrit ses réservations ; les événements manuels de l’agenda dédié deviennent des indisponibilités. La modification d’un événement de réservation dans Outlook n’est pas une commande de modification Supabase ; utiliser le Manager. Pas de webhook temps réel ni synchronisation bidirectionnelle des fiches clientes.

Le crâne, la palette, les médias, la police, la section de Mélanie et la logique de musique sont conservés. Le catalogue serveur actualise le sélecteur après modification Manager. Cache public versionné et excluant explicitement les API et le Manager ; service worker Manager limité à son interface publique sans donnée cliente. Les vidéos passent directement par le réseau, sans cache de segments partiels.

## Tests réalisés ici

| Contrôle | Résultat et portée |
|---|---|
| Syntaxe JavaScript | Tous les fichiers site/fonctions contrôlés avec Node |
| Tests Node | 9 réussis : validation, chiffrement, liens, ICS, accès anonyme, allowlist/MFA, prompt/outils Melba, proposition sans écriture, SMS ambigu sans renvoi automatique |
| Migrations | 001 à 004 exécutées avec succès sur PostgreSQL embarqué PGlite + btree_gist |
| Catalogue | 64 feuilles importées ; données comparées à la V14 et à l’annexe Word |
| Réservation multiple | 90 + 15 = 105 minutes et 52 + 2 = 54 € ; pause respectée |
| Doubles demandes | Deux demandes soumises en parallèle au moteur local : une seule acceptée ; double clic avec même clé retourne le même RDV |
| Liens et modification | Clé/idempotence forgées refusées ; déplacement et annulation ; créneau libéré |
| Blocages et incompatibilités | Congés et paires incompatibles bloquent le choix |
| Contrôles SQL | Lecture clientes et appels RPC interdits au rôle anon |
| Fuseau | Conversion Paris hiver/été vérifiée |
| Chromium ordinateur | 1440 × 1000 : crâne, sélection, formulaire, confirmation Melba, connexion MFA et vues Manager ; aucune erreur JS |
| Chromium tablette | 820 × 1180 : mêmes parcours ; aucun débordement horizontal |
| Chromium mobile | 390 × 844 : mêmes parcours ; aucun débordement horizontal |
| Vidéos | 12 fichiers H.264 vérifiés avec ffprobe ; 12 changements de source et lectures réussis dans Chromium |
| Intégrité des médias | Aucun original remplacé ; fichiers communs à la V14 préservés |
| Déploiement | Aucun |

Les tests SQL utilisent une base temporaire embarquée ; ils ne reproduisent pas deux connexions réseau PostgreSQL indépendantes. La contrainte d’exclusion et le verrou transactionnel sont présents et exercés, mais le test de contention à deux navigateurs sur Supabase réel reste à faire. Les essais de navigation utilisent des réponses API simulées : ils valident les interactions, pas les comptes fournisseurs réels. L’affichage Android installé, Safari/iOS, le contexte PWA autonome et les politiques spécifiques à ces appareils restent à contrôler après mise en ligne autorisée. La musique d’origine respecte le premier geste et le refus d’autoplay ; aucune garantie d’autoplay sonore n’est donnée.

## Recette réelle restant à signer avant ouverture

- [ ] Résultats de `000_audit.sql` examinés et sauvegardes de production faites.
- [ ] Migrations exécutées sur un environnement isolé, puis plan production approuvé.
- [ ] Compte Mélanie, inscription publique désactivée, allowlist et récupération MFA validées.
- [ ] Horaires, marges, règles de compatibilité, annulation, données personnelles et conservation validés.
- [ ] Réservations réelles de test : deux prestations, concurrence depuis deux navigateurs, modification/annulation, erreurs et limites.
- [ ] Modèle Anthropic d’origine vérifié avec la clé réelle ; conversation Melba et réclamation testées avec accord.
- [ ] E-mail Resend réellement reçu par la cliente et Mélanie ; pièce ICS acceptée.
- [ ] Notifications/rappels Brevo reliés à une réservation validés ; aucun nouveau SMS technique envoyé ici. La réception du test d’origine est une information de la transmission, pas un test refait.
- [ ] Consentement OAuth donné par Mélanie, bon calendrier choisi, créations/modifications/annulations Graph et renouvellement testés.
- [ ] Tâche Netlify active, journaux contrôlés ; acceptation fournisseur distinguée de réception effective.
- [ ] PWA Manager installée et testée sur l’Android de Mélanie et son PC, données clientes inaccessibles après déconnexion.
- [ ] Rapprochement de tous les RDV SimplyBook futurs et arrêt des nouvelles prises de RDV dans l’ancien système.
- [ ] Suppression locale SimplyBook avec le script de finalisation, puis nouveaux tests.
- [ ] Preuve de licence October Crow disponible.
- [ ] Accord explicite de publication obtenu.

Signature de recette : non signée. Validation de publication : non donnée.

## Références techniques utilisées

- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/guides/auth/jwts
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- https://learn.microsoft.com/en-us/graph/auth-v2-user
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://developers.brevo.com/docs/transactional-sms-endpoints
- https://docs.netlify.com/build/functions/scheduled-functions/

Pour Brevo, le code métier conserve l’endpoint et l’expéditeur exacts du RAW reçu ayant déjà fonctionné, plutôt que de remplacer le test connu par un nouvel endpoint non testé.
