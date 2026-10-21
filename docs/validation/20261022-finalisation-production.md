# Belle & Rebelle — consolidation de production, 22 octobre 2026 (Paris)

## Référence et périmètre
Les deux rapports Word transmis ont été lus intégralement. Point de départ vérifié : main `00fa4d5e6705ac0a399dc982b3dae7e8a0193a88`, Netlify production `6ad93f34cd7d792ec5f61fb1`, état ready/published. Un seul site officiel : belleetrebelle-nailstudio. Aucun nouveau site créé.

## Correctifs
- L'identité du compte connecté est affichée avant la saisie MFA pour éviter l'utilisation du mauvais Authenticator.
- Sans facteur vérifié, la saisie du code attend l'enrôlement ; le QR apparaît uniquement après action explicite. Double clic d'enrôlement empêché.
- Le QR et la clé temporairement affichés sont effacés de l'interface après validation ou déconnexion/session expirée. Aucun secret dans ce rapport.
- Aucun facteur réel, mot de passe, droit ou session existante n'a été modifié.
- B&R APP : correction d'une variable non initialisée lors d'un événement d'installation tardif dans l'iframe ; la fenêtre native attend un clic effectif de l'utilisateur.
- Instructions Android utilisables lorsque le navigateur ne propose pas de prompt natif.
- Service worker B&R APP `br-app-v2` : coque/manifeste actualisés en priorité depuis le réseau, secours hors ligne, périmètre /app/ seulement.
- Headers de réactualisation /app/* et type MIME explicite du manifeste client.
- Manager `br-manager-v15-8` pour signaler la nouvelle version aux installations existantes sans réinstallation.
- Tests navigateur anciens : sélection explicite du bouton de soumission après ajout du bouton œil. Ancien test de comparaison à origin/main retiré : il n'était pas une vérification fonctionnelle et interdisait toute évolution autorisée. Remplacé par tests comportementaux de coexistence des workers et de l'installation.

## Preuves exécutées avant publication
- 145 tests Node : succès, zéro échec.
- Vérification syntaxique : 37 fichiers JS, 64 prestations.
- Tests SQL PGlite : toutes les migrations et assertions passent (multi-prestations, conflits concurrents, prix historiques, annulation, déplacement, horaires, pauses, droits).
- Tests rappels : planification à 24h, déplacement, obsolescence, annulation, déduplication, reprise après crash : succès, fournisseurs absents/simulés.
- Tests navigateur Manager : 5 configurations (ordinateur, mobile navigateur, mobile autonome simulé, paysage, ancien media-query) : succès.
- Tests navigateur MFA distincts : premier enrôlement et facteur déjà vérifié ; mauvais code récupérable sans déconnexion ; passage au tableau de bord après réponse AAL2 ; déconnexion et effacement QR : succès. API simulées, pas de secrets de comptes réels.
- Tests récupération navigateur : 9 parcours réussis, sans e-mail ni changement réel de mot de passe.
- Tests navigateur site : ordinateur/tablette/téléphone/paysage, crâne interactif, multi-prestations, annulation finale, parcours Melba simulé et Manager : succès sans erreur JS.
- 12 vidéos originales MP4 lues dans Chromium local, puis tests rejouer/pause/précédent/suivant/libération ressources/erreur-réessai : succès. Aucun remplacement des médias.
- Workers réellement enregistrés et activés dans le même profil Chromium local : /app/sw.js pour /app/, /manager/sw.js pour /manager/, identités de manifestes distinctes ; contrôle conservé après navigation entre les applications. Aucun cache d'API/vidéo.
- Navigateur cloud officiel : Manager accessible sans écran d'erreur au chargement ; vidéos 1 et 2 réellement lues. Pas de connexion personnelle possible sans l'utilisateur.

## État réel des services (lecture seule)
- Production Supabase : 64 prestations ; réservations ouvertes ; email actif ; SMS confirmation actif ; SMS rappel désactivé dans les préférences existantes, non changé.
- Deux comptes Manager actifs.
- Mélanie : un facteur TOTP vérifié conservé. Logs : connexions MFA réussies à 20:29, 20:33 et 21:12 UTC le 21/10 ; codes invalides ultérieurs à 21:56–21:57. Cela ne prouve pas une connexion personnelle réussie après le présent déploiement.
- Cyril : facteur TOTP non vérifié, créé à 22:29 UTC le 21/10. Aucune validation MFA personnelle réussie démontrée. Son scan et son code personnel restent indispensables, sans intervention de l'agent sur le secret.
- Outlook : connecté, calendrier sélectionné, dernière synchronisation 21/10 23:00:20 UTC sans erreur au contrôle initial. Deux tâches Outlook acceptées. Aucun événement créé/modifié pour les tests de cette intervention.
- Resend : les quatre confirmations récentes (deux clientes et deux Manager) indiquées livrées par le fournisseur. Aucun renvoi effectué.
- File SMS : un accepté, un incertain ; aucune relance du SMS incertain afin d'éviter un doublon et des frais. Les journaux Brevo détaillés ne sont pas disponibles via les connecteurs de cette session.
- Deux rappels email futurs en attente ; pas déclenchés artificiellement.
- Conseiller Supabase : tables privées RLS sans policy (INFO attendu pour accès uniquement serveur) ; protection des mots de passe divulgués désactivée (WARN existant). Aucun assouplissement de protection effectué.

## Limites et interventions personnelles strictement nécessaires
- Cyril doit scanner son QR personnel puis valider son propre code pour terminer l'enrôlement. L'agent ne peut pas valider la possession du téléphone à sa place.
- Mélanie doit utiliser l'entrée Authenticator correspondant à son propre compte ; aucune réinitialisation justifiée par les seules erreurs de code observées.
- Installation native sur Android/iPhone physiques non exécutée par l'agent. Les scopes, workers, manifestes, boutons et comportements dégradés sont testés techniquement ; cela ne constitue pas une preuve d'installation physique.
- Le SMS incertain doit être rapproché du journal Brevo avant toute relance. Les rappels SMS restent volontairement dans leur état initial désactivé.
- Réserves juridiques antérieures conservées, notamment médiation à régulariser. Aucun contenu juridique modifié.

## Publication
Les correctifs sont destinés à main et à un seul déploiement Git de production. Le SHA final et l'identifiant de déploiement sont fournis dans le compte rendu après vérification Netlify. En cas de régression : revert Git ciblé puis publication corrective ; aucune restauration de données nécessaire pour ces changements sans migration.
