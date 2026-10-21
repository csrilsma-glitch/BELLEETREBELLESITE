# Consolidation V15 — 21 octobre 2026

Périmètre exclusif : préproduction xrpjrweqdhihloykabml / belleetrebelle-v15-preproduction. Aucun SMS/e-mail réel. Aucun accès de production modifié.

## État réel de ce lot

- Synchronisation des indisponibilités : code développé, 7 nouveaux tests de livraison Outlook et un test anti-boucle. 105 tests Node passent au dernier contrôle. Création, modification, suppression, reprise après réponse perdue et verrouillage couverts en simulation. Aucun événement Outlook écrit lors de cette consolidation.
- Migration `pending_manager_blocks_outlook.sql` encore NON appliquée et NON canonique. Ne pas déclarer le lot opérationnel avant application au projet de test et déploiement contrôlé. Le worker ancien ne doit pas consommer les nouveaux jobs : déployer le worker compatible avant la migration. L'autorisation préalable de test Outlook n'implique aucune autorisation de production.
- Manager : vérification SQL en lecture seule ; un compte technique actif dispose d'un facteur MFA vérifié. L'ancien compte de validation est inactif. Aucun compte Manager pour belleetrebelle.flers@outlook.com. Ne pas renommer le compte technique ; créer/activer séparément l'identité de Mélanie par une procédure Auth approuvée. Aucun mot de passe changé, aucun e-mail envoyé. MFA et récupération de Mélanie NON validés en situation réelle.
- Pages juridiques : mentions légales, confidentialité, conditions de réservation, cookies. Brouillons clairement signalés, noindex, liens de pied de page et information confidentialité au formulaire. Non approuvés pour lancement.
- SIRET 88254430700011 : correspondance retrouvée via l'API officielle de recherche d'entreprises pour Belle & Rebelle, exploitante Mélanie RIPALDI (BONNEVILLE), entreprise individuelle active. Nom civil et adresse supplémentaires non insérés automatiquement dans les nouvelles pages. Source : https://recherche-entreprises.api.gouv.fr/search?q=882544307 ; validation finale des mentions d'identité et domiciliation nécessaire.
- TVA : aucune franchise présumée ; justificatif fiscal nécessaire. Ne pas déduire le régime de l'absence de récupération de TVA.

## Audit RGPD / cookies

Stockages : sélection et préférences en sessionStorage, cookies sécurisés de session et récupération Manager, cache statique PWA. Pas d'outil publicitaire/d'audience identifié dans le code. Google Fonts encore distant : pas de déclaration trompeuse d'absence de connexion Google. Éléments injectés par hébergeur à vérifier sur déploiement. Pas de bandeau ajouté sans traceur non essentiel identifié.

Melba utilise Anthropic ; base et Auth Supabase ; fonctions Netlify ; calendrier Microsoft ; notifications Resend/Brevo lorsqu'activées. Transferts hors EEE et contrats sous-traitants à examiner. Paramètre de conservation 365 jours ne constitue PAS une purge automatique. Politique opérationnelle à valider. Droit de rétractation/exécution anticipée à qualifier : règle 24 heures ne remplace pas les droits légaux.

Informations indispensables : identité/statut et adresse professionnelle autorisés pour publication, téléphone professionnel confirmé, régime TVA justifié, médiateur effectivement choisi et coordonnées, durées de conservation et procédure d'application, validation droit de rétractation et contrats fournisseurs.

## Tests et limites

- `npm run check` : 32 fichiers JS valides, 64 prestations conservées.
- `npm test` : 105 réussites, 0 échec.
- Nouvelle relance SQL bloquée initialement par dépendance PGlite absente ; installation en cours. Les logs antérieurs mentionnent réussite SQL mais ne remplacent pas la relance après modification.
- Aucun nouveau test navigateur/deploiement réel annoncé réussi.
- Fonts téléchargées expérimentalement NON intégrées au lot (licences/upload à étudier, facultatif) ; polices d'origine conservées.

## Avant déploiement fonctionnel

1. Réussir tests SQL et rappels avec dépendances restaurées ; vérifier permissions migration et conseillers sécurité.
2. Déployer code compatible uniquement sur préproduction, puis appliquer migration et renommer fichier à la version réelle.
3. Vérifier table privée et jobs, permettre uniquement les écritures Outlook de test explicitement autorisées et nettoyer les fixtures.
4. Contrôler Manager et liens juridiques sur le déploiement réel, sans tests manuels redondants.
5. Activer l'identité personnelle de Mélanie avec MFA ; finaliser informations juridiques.

La V15 n'est pas déclarée prête pour la production.

## Mise à jour après consolidation

Migration appliquée exclusivement au projet test, version canonique 20261021085503_manager_blocks_outlook.sql. Table RLS active, lecture anon/authenticated refusée. 64 prestations toujours présentes. Un bloc existant rattrapé en file avec délai initial de 10 minutes ; aucune écriture Graph par la migration. OUTLOOK_PREPROD_TEST reste faux.

Dépendances de tests restaurées via npm ci. Tests SQL et rappels relancés : tous réussis. Le lot est sauvegardé sur GitHub ; le checkpoint 321b61f ne déclenche pas de build. Le commit suivant déclenche uniquement la préproduction.

Conseillers sécurité : pas d'erreur RLS ; informations « RLS sans politique » attendues pour tables exclusivement serveur, et avertissement protection contre mots de passe compromis désactivée. Ne pas ouvrir de politiques publiques pour supprimer ces informations.

Le drapeau historique PREPROD_REAL_TEST existe encore ; le code de notifications ignore ce drapeau et impose la simulation en préproduction. Une tentative de nettoyage via connecteur n'a pas réussi ; aucun changement de ce paramètre revendiqué.

## Preuves du déploiement et contrôles finaux

- Commit applicatif : e3443576a67e9b82e38cd1ed4f8f986b8bb64394.
- Déploiement préproduction : 6ad87e11ce4d981b465ab3cf, ready, publié 2026-10-21T08:56:02.300Z. Correspondance commit vérifiée par connecteur Netlify.
- HTTP 200 : mentions-legales.html, confidentialite.html, conditions-reservation.html, cookies.html et manager/. Brouillons visibles. Mentions légales et confidentialité ouvertes dans le vrai navigateur cloud ; confidentialité sans débordement horizontal sur viewport 1363 px. Pas de nouvelle validation Android revendiquée.
- Contrôle transactionnel sur la vraie base TEST : insert pause fictive année 2099 → version 1 ; RPC modification → version 2 ; suppression → version 3 tombstone ; un seul job pending ; assertions réussies puis ROLLBACK intégral. Aucun appel Outlook.
- Permissions RPC réelles : anon ne peut pas modifier ; authenticated ne peut pas acquérir le verrou ; service_role autorisé.
- Recette automatisée Manager relancée : bloquée au lancement car Chromium absent. Aucun test d'interface Manager supplémentaire déclaré réussi. Sélecteurs du test adaptés au nouveau bouton de réinitialisation.
- Un premier contrôle HTTP du catalogue a utilisé le mauvais nom /catalogue et reçu 404 ; le chemin réel du code est /catalog. Ce 404 n'est pas une régression du serveur.

Bilan : développement et migration des pauses déployés, synchronisation réelle Outlook NON activée (flag false). Compte Mélanie NON activé. Informations juridiques et politique de conservation à finaliser, alerte mots de passe compromis à traiter selon disponibilité du plan. Aucune certification « prête production ». Aucun changement production ni envoi réel.
