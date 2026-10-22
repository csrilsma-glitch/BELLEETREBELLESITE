# 04 — Interface et ergonomie responsive

Formats testés en navigation automatisée : ordinateur 1440 × 1000, tablette 820 × 1180, mobile 390 × 844, paysage 844 × 390. **Ces tests sont des simulations de navigateur. Ils ne remplacent pas un test sur appareil physique** (Android, iPhone), qui reste à faire pour chaque point.

## HTN-ERR-014 — Mot de passe sans contrôle d'affichage

- **Symptôme :** la gérante ne pouvait pas vérifier la saisie de son mot de passe (connexion, nouveau mot de passe, confirmation) avant de valider.
- **Cause :** démontrée : aucun bouton d'affichage ajouté aux champs du Manager.
- **Impact :** erreurs de saisie répétées, blocage de connexion. Gravité moyenne.
- **Détection :** parcours de connexion et de changement de mot de passe sur mobile.
- **Réparation :** contrôles d'affichage accessibles, masqués par défaut, sur les trois champs. Les valeurs ne sont pas stockées. Masquage automatique à la soumission, à la réinitialisation, au passage en arrière-plan et à la fermeture.
- **Prévention :** prévoir l'affichage du mot de passe dans tous les formulaires d'authentification des templates. Conserver l'autocomplétion du navigateur.
- **Test :** 115 tests Node ; contrôle navigateur sur les formats ci-dessus. Test sur appareil physique : à faire.
- **Statut :** corrigé ; testé en simulation.
- **Traçabilité :** `docs/validation/20261021-pwa-production.md`.

## HTN-ERR-015 — Notes clientes : contenu invalide et confirmation ambiguë

- **Symptôme :** une note non textuelle ou très longue pouvait être acceptée ou tronquée sans avertissement. Si la note était modifiée pendant son envoi, la confirmation pouvait laisser croire que la version affichée était enregistrée.
- **Cause :** démontrée par des tests de régression écrits le 21 octobre, en échec avant correction.
- **Impact :** perte silencieuse de texte, mauvaise information sur l'état d'enregistrement. Gravité moyenne.
- **Détection :** envoi d'une note très longue, d'un contenu non textuel, et modification pendant l'envoi.
- **Réparation :** refus explicite des contenus non textuels et trop longs (pas de troncature silencieuse). Protection contre les sauvegardes concurrentes. La confirmation distingue la version enregistrée des modifications encore à sauvegarder.
- **Prévention :** toute saisie longue doit être refusée explicitement, jamais tronquée. Une confirmation ne doit décrire que ce qui a été enregistré.
- **Test :** tests de régression ; contrôle navigateur : note concurrente, brouillon restant à enregistrer, rechargement et relecture.
- **Statut :** corrigé ; testé (navigateur simulé). Validation sur appareil : à faire.
- **Traçabilité :** `docs/validation/20261021-work.md` ; `docs/validation/20261021-finalisation.md`.

## HTN-ERR-016 — Lecteur vidéo : ressources non libérées et erreurs non récupérables

- **Symptôme :** après plusieurs vidéos, la lecture pouvait se bloquer, ou une erreur de lecture ne permettait pas de réessayer.
- **Cause :** démontrée lors de la conception du lecteur de galerie (19 octobre) : ancienne source non libérée, absence de réessai.
- **Impact :** galerie inutilisable sur certains appareils. Gravité moyenne.
- **Détection :** lecture successive des douze vidéos originales, pause, navigation rapide, fin de lecture, rejeu.
- **Réparation :** renouvellement de l'élément vidéo, libération de la source précédente, boutons lecture/pause/rejouer, message d'erreur avec réessai, navigation rapide.
- **Prévention :** libérer systématiquement les ressources média au changement de source. Ne jamais mettre en cache de segments vidéo partiels.
- **Test :** lecture des douze fichiers MP4 originaux (vérification par ffprobe et lecture navigateur simulé) : lecture, fin, rejeu, navigation et réessai réussis. Lecture sur Android et iPhone réels : **à faire**.
- **Statut :** corrigé ; testé en simulation ; à surveiller sur appareil réel.
- **Traçabilité :** `docs/PREPRODUCTION_20261019.md` ; `docs/validation/20261021-production-go.md`.

## HTN-ERR-017 — Échec vidéo dans un navigateur sans décodeur H.264 (faux positif d'environnement)

- **Symptôme :** dans une session de test, la première vidéo renvoyait une erreur 4 (format non décodé).
- **Cause :** démontrée : le navigateur de l'environnement de test ne décodait pas H.264. Les fichiers sont valides (vérifiés avec ffprobe). **Ce n'est pas un défaut du site.**
- **Impact :** aucun pour les visiteurs ; risque de fausse alerte dans les rapports.
- **Détection :** vérifier le codec des fichiers et les capacités du navigateur avant de conclure.
- **Réparation :** aucune sur le site. Relancer le test sur un navigateur complet.
- **Prévention :** tout test média commence par un contrôle des capacités du navigateur. Un échec d'environnement est documenté comme tel.
- **Test :** relancer la lecture sur un navigateur disposant du décodeur.
- **Statut :** non-défaut (limite d'environnement).
- **Traçabilité :** `docs/ETAT_NUIT_2026-10-19.md`.

## HTN-ERR-018 — Confirmation native non pilotable par l'outil de test

- **Symptôme :** l'annulation d'un rendez-vous, qui passe par une boîte de dialogue native du navigateur, ne pouvait pas être validée par l'outil de test automatisé.
- **Cause :** limite de l'outil de test, pas du site.
- **Impact :** test incomplet, risque de fausse conclusion. Gravité faible.
- **Détection :** le test ne passait pas l'étape de confirmation.
- **Réparation :** méthode de test adaptée : gestion explicite de la boîte de dialogue native, puis vérification de l'état final en base (20 octobre).
- **Prévention :** ne jamais affirmer une action validée sans vérifier son résultat en base.
- **Test :** annulation client dans le navigateur, dialogue confirmé, état « annulé » vérifié en SQL.
- **Statut :** corrigé côté test ; testé.
- **Traçabilité :** `docs/validation/20261020-preproduction.md` ; `docs/validation/20261020-evening.md`.

## HTN-ERR-071 — Markdown affiché brut dans l'assistant

- **Symptôme :** les doubles astérisques de Melba s'affichent (« **Mardi** »).
- **Cause :** démontrée avant la PR : affichage en texte brut sans traitement.
- **Impact :** lisibilité. Gravité faible.
- **Réparation :** dans la PR, seuls les marqueurs gras appariés sont retirés ; l'affichage reste en `textContent`, donc sans HTML.
- **Prévention :** tout texte d'agent est affiché comme texte ; tout formatage est explicite.
- **Test :** réponse avec gras et balise `<script>` : pas de marqueur, rien d'exécuté. Preuve annoncée par Work, **non reproduite ici** (navigateur indisponible).
- **Statut :** corrigé dans la PR ; à relancer sur navigateur.
- **Traçabilité :** `site/assistant.js` ; `contre-audit-pr3.md`.

## HTN-ERR-072 — Grille de créneaux démesurée

- **Symptôme :** une longue liste de boutons de créneaux, pénible sur téléphone.
- **Cause :** démontrée avant la PR : un bouton par créneau, dans la réservation, le déplacement client et le déplacement Manager.
- **Impact :** ergonomie mobile. Gravité moyenne.
- **Réparation :** dans la PR, menu `<select>` natif avec libellé et groupes Matin / Après-midi, choix initial obligatoire. Les créneaux serveur ne changent pas.
- **Prévention :** tout choix de plus de quelques créneaux est un menu natif.
- **Test :** 0, 1 et 96 créneaux sur 390, 820 et 1440 px. Preuve annoncée par Work (96 options), **non reproduite ici**.
- **Statut :** corrigé dans la PR ; à relancer sur navigateur.
- **Traçabilité :** `site/reservation.js`, `site/manager/manager.js`, `site/native.css` ; `contre-audit-pr3.md`.

## HTN-ERR-073 — Réponse ou proposition tardive encore actionnable

- **Symptôme :** une réponse réseau arrivée après un changement de date, ou une proposition précédente, pouvait rester cliquable ou remplacer le résultat courant.
- **Cause :** démontrée avant la PR par lecture : aucune génération de requête côté assistant ni côté réservation.
- **Impact :** horaire d'une autre date proposé ; confirmation d'une proposition obsolète. Gravité moyenne.
- **Réparation :** dans la PR, génération de requête (`requestSequence`), boutons de proposition désactivés au message suivant, réponses tardives ignorées, `requestKey` réinitialisé dans `clearSlot` (vérifié par lecture).
- **Prévention :** toute réponse asynchrone est rattachée à sa génération de requête.
- **Test :** inverser l'ordre des réponses réseau ; changer de date pendant une recherche. Preuve annoncée par Work, **non reproduite ici**.
- **Statut :** corrigé dans la PR par lecture de code ; à relancer sur navigateur.
- **Traçabilité :** `site/assistant.js`, `site/reservation.js`, `site/manager/manager.js` ; `contre-audit-pr3.md`.
