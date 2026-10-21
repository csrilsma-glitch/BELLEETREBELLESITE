# V15 finalisation du 21 octobre 2026

## Résultat
5766b25 a été publié sur belleetrebelle-v15-preproduction, déploiement 6ad857bda87dc877448e7c66 (ready, 08h12 Paris). Le correctif Melba du présent commit complète uniquement le contexte métier avec les horaires réels du Manager. SYSTEM_PROMPT, personnalité, outils et médias conservés. Un second déploiement regroupé est prévu pour ce correctif ; consulter Netlify pour le résultat final.

## Modifications
- Préproduction uniquement : OUTLOOK_PREPROD_TEST=false dans les quatre contextes existants. L'outil a renvoyé 422 mais la relecture a confirmé la mise à jour : ne pas conclure à l'absence d'effet d'après le seul code d'erreur. La synchronisation ET les écritures Outlook sont ainsi suspendues pendant la recette. Aucun jeton supprimé, aucun événement réel modifié. Réactivation à organiser avec autorisation pour les effets calendrier.
- Migration SQL move_btree_gist_to_extensions appliquée sur la seule base de test. Extension déplacée de public vers extensions, sans suppression. Alerte extension_in_public disparue après recontrôle.
- Melba recevait le catalogue et la politique de paiement mais pas les heures d'ouverture : réponse réelle reproduite « horaires non à jour ». Ajout de br15_hours au contexte serveur, en lecture parallèle avec le catalogue. Horaires habituels explicitement distincts des disponibilités et absences.
- Le test métier vérifie les horaires, le dimanche fermé, les règles de paiement et la conservation du prompt et des outils.

## Preuves exécutées
- 92 tests Node passent après le correctif Melba ; 33 fichiers JS valides et 64 prestations conservées.
- Manager automatisé : 5 configurations passent, dont standalone simulé, paysage et ancien MediaQueryList.
- Navigateur local complet : crâne, sélection multiple, proposition Melba, annulation finale, Manager MFA simulé et cache ; 4 dimensions, aucun défaut JavaScript. Fournisseurs simulés.
- Rappels : cycle email/SMS 24h, déplacement, obsolescence, annulation répétée, délai 24h et reprise après crash passent avec PGlite.
- Manager publié et session authentifiée existante : note sur la seule fiche fictive [TEST V15] Interface finale enregistrée et relue après rechargement. Première tentative en lenteur Auth, deuxième réussie. Note initiale vide restaurée et relue en SQL.
- Période inversée : erreur locale visible. Période valide : confirmation visible et 88 créneaux multi-prestations devenus 0 en SQL. Retrait depuis Manager : 88 créneaux retrouvés, aucun bloc fictif restant.
- Réservation publique réelle en TEST : trois prestations, 110 min et 58 euros. Création sans compte client, confirmation sans notification réelle, affichage des 3 services dans Manager, déplacement du 4 au 5 novembre à 10h Paris, annulation finale. SQL : status annule, revision 3, services 3, minutes 110, cents 5800, zéro rappel actif, zéro événement Outlook.
- 12 vidéos originales publiées : lancées successivement via les boutons Lire/Pause/Suivante dans Chromium cloud ; 12 sources distinctes, readyState 3/4, aucune erreur média remontée. La fin/relecture/navigation rapide sont couvertes par la suite locale ; Android matériel reste à valider.
- SQL réel après migration : catalogue/totaux, création, idempotence, rappel 24h, refus lien forgé, déplacement, annulation et refus sous 24h passent. Sous-transaction annulée via exception contrôlée ZV015 : aucune donnée/job visible aux fournisseurs. Deux premières tentatives non validées (erreur de construction SQL, puis état MCP expiré) remplacées par le test atomique réussi.
- Aucune écriture dans la base production, aucun déploiement officiel, aucun vrai e-mail/SMS et aucun événement Outlook créé par ces essais.

## Sécurité Supabase
12 tables RLS, zéro droit de table pour anon/authenticated, zéro RPC br15_* exécutable par ces rôles. Les 12 notices RLS sans politique sont INFO et correspondent au serveur seul : aucune politique permissive ajoutée.
L'alerte mot de passe compromis reste : l'interface confirme « Only available on Pro plan and above ». Aucun achat/upgrade et aucun changement des identifiants. MFA conservée.
Liens :
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## E-mail réel inexpliqué
Message Resend du 20 octobre à 19h21 Paris, objet sans préfixe TEST. Son corps commence pourtant par TEST PRÉPRODUCTION, rendez-vous fictif, aucune action requise. Il contient un identifiant synthétique finissant par f1c7, un jeton littéral de test et 77 euros pour des libellés Gel pose/Déco simple. Cet identifiant de réservation est absent de Supabase test et la chaîne exacte n'est pas dans l'historique Git inspecté. Conclusion étayée : scénario/fixture de test, pas preuve d'un rendez-vous cliente issu du moteur. L'auteur et le canal d'appel API exact ne sont pas déterminables par les métadonnées accessibles ; ne pas les attribuer à Claude ou Work sans journal supplémentaire.
L'ancien mode réel limité ajouté par 351bc90 explique techniquement les confirmations ultérieures préfixées TEST possibles dans les versions anciennes ; il a été retiré par 130908a. Ce constat historique ne permet pas de lui attribuer le message de 19h21. Dernier code : simulation inconditionnelle des e-mails/SMS en préproduction ; ancienne exception de récupération supprimée dans 5766b25.

## Reprise SimplyBook sans import
Aucune donnée réelle extraite/importée, aucun nombre de rendez-vous futurs prétendu. La fonction historique fournit notamment les appels de réservation, mais ne constitue pas un export certifié des RDV existants.
Avant bascule : exporter les rendez-vous futurs confirmés avec identifiant original, début/fin et fuseau, prestations, statut, contacts nécessaires et historique de déplacement ; mapper les 64 identifiants ; dédoublonner par identifiant source ; rapprocher avec le calendrier Outlook pour éviter de compter deux fois un même rendez-vous ; tester la conversion heure d'été/hiver. Préparer soit une reprise fidèle, soit des périodes bloquées de transition. Garder SimplyBook actif jusqu'au rapprochement et à l'accord final. Aucun message automatique à l'import. Conserver un journal des correspondances et une liste des conflits pour Mélanie.

## Recette Android et derniers points
1. Ouvrir le Manager test et sa PWA installée : Installer absent en standalone. Aucun nouveau mot de passe/code à transmettre au chat.
2. Note fictive : enregistrer, confirmation près du bouton, recharger ; modifier pendant l'envoi et vérifier le brouillon restant à enregistrer.
3. Période inversée refusée ; période valide créée, créneau disparu, retrait et créneau rétabli ; portrait et paysage.
4. Plusieurs prestations, prix/durée et vidéos successives. Aucun essai de vraie cliente.
5. Valider l'accès personnel et la récupération de Mélanie séparément, sans désactiver MFA.
6. Réautoriser un essai Outlook dans le calendrier dédié puis revalider aller-retour et politique outlook_required (actuellement false). Aucune nouvelle authentification Microsoft demandée dans cette intervention.
7. Rapprochement SimplyBook, notifications réelles et lancement officiel soumis à accord distinct.

Verdict : nette progression, code prêt pour recette Android après publication du correctif horaire ; pas de bascule officielle tant que les points ci-dessus restent ouverts. Une lenteur Auth transitoire a été observée et doit rester surveillée.

## Complément final après publication
- Correctif Melba publié et vérifié réellement : commit 770b0cd7856d076cd91d7998e6118e80222aec26, deploy 6ad85d2010043f3ea47dc488, ready à 08h35m28s Paris. Réponse réelle correcte pour lundi-jeudi, vendredi, week-end fermé et aucun acompte.
- Deux déploiements seulement : 5766b25 puis 770b0cd. Les migrations SQL suivantes ne nécessitent pas de build Netlify.
- Préférences inchangées réenregistrées : confirmation visible. Horaires initialement refusés : diagnostic serveur « DELETE requires a WHERE clause », dû à Safe Updates en contexte API (les essais SQL directs postgres seuls ne reproduisaient pas la protection).
- Correction br15_admin : DELETE FROM br15_hours WHERE id IS NOT NULL, remplacement atomique des plages conservé. Réponses JSON construites par jsonb_build_object. Tentative de fiabilisation JSON seule insuffisante, puis diagnostic temporaire et correction Safe Updates ; le diagnostic détaillé a été retiré de la fonction finale.
- Sauvegarde réelle depuis le Manager réussie après migration, message Horaires enregistrés ; les 5 horaires et 64 prestations relus inchangés. Aucun changement de préférence/horaire métier recherché.
- Migration finale et tests SQL sauvegardés avec ce rapport. PGlite émule désormais le schéma extensions de Supabase ; un test fonctionnel supplémentaire vérifie la sauvegarde des horaires/pauses sans altération. Suite SQL entière réussie.
- Test HTTP réel concurrent : réponses 201 et 409 pour deux réservations du même créneau, un seul gagnant ; annulation du gagnant deux fois, deux réponses 200. Endpoints Manager non authentifiés : 401. Données clairement fictives, réservations annulées conservées comme preuves ; aucun événement ni notification réelle.
- Catalogue publié : 200, test_mode=true, 64 services. Manifest Manager : 200 application/manifest+json. Service worker : 200 et cache br-manager-v15-4.
- File du rendez-vous multi-prestations : versions précédentes obsolètes ; tâches courantes e-mail cliente, e-mail Manager et Outlook marquées preprod-simulated. Zéro rappel actif et zéro événement Outlook pour cet essai.
- Aucun état failed/uncertain dans la file à la dernière lecture. Une lenteur Auth ponctuelle reste observée ; ne pas annoncer une absence universelle d'erreurs.
