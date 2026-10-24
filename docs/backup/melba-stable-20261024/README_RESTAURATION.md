# Melba stable — sauvegarde et restauration

Référence complète : `4960ca8dceb762dd55f2c166cf8333d53be0ad90`, arbre `1eb18a98fe543fda1ffe4f29be41f04f9e1538fd`.
Production vérifiée : Netlify `belleetrebelle-nailstudio`, déploiement `6adc2d56e3c423f4f52a53b4`, ready, publié le 24/10/2026 à 06:00:40 Paris. La réussite réelle Android/PWA, rendez-vous, Manager, SMS, e-mail et Outlook est rapportée par le propriétaire ; cette mission n'a pas rejoué ces opérations réelles.

## Éléments sauvegardés
La branche distante `backup/melba-stable-20261024` pointe exactement vers cette référence : les 340 fichiers suivis, fonctions serveur et bibliothèques, chat et moteur séquentiel, sessions et signatures, catalogue et arborescence des 64 prestations, interfaces accueil/réservation/app/Manager, médias, migrations SQL, scripts, tests, package-lock et netlify.toml. Aucun deuxième service actif n'est créé.
Le manifeste adjacent décrit la référence et les empreintes. Une archive Git complète a été générée et extraite localement ; son SHA256 figure au manifeste. Le catalogue et la syntaxe des 40 fichiers JS stables ont été contrôlés sur cette extraction. Les 357 tests Node stables et le parcours HTTP/SQL navigateur isolé ont passé avant toute modification fonctionnelle. Les dépendances préexistantes ont été réutilisées ; aucun téléchargement propre ni build Netlify distant de secours n'a été exécuté. Les dépendances exactes sont décrites par package-lock.
L'archive locale n'est pas un stockage durable et ne remplace pas la branche distante. Elle n'a pas été publiée : les médias et tout l'arbre sont récupérables via Git ; aucune copie des données de base n'y figure.

## Tag : limite importante, non masquée
Tag annoté local : `melba-stable-20261024`, objet `b0d57168528cb1bd9c4b266e647f11a86bc1091e`. **Pas encore publié sur GitHub.** Le connecteur permet les branches mais pas la création de tags ; le push Git exige une authentification absente, et le navigateur GitHub présente une connexion. Aucune clé personnelle n'a été créée.
Le fichier `tag-object.txt` conserve l'objet annoté intégral sans secret, avec son auteur, sa date, son message et sa cible. `git mktag < docs/backup/melba-stable-20261024/tag-object.txt` a reproduit exactement le SHA ci-dessus.
Depuis un clone authentifié et après vérification de l'absence d'un tag homonyme :

```sh
git fetch origin backup/melba-stable-20261024
git rev-parse origin/backup/melba-stable-20261024
# Attendu : 4960ca8dceb762dd55f2c166cf8333d53be0ad90
git mktag < docs/backup/melba-stable-20261024/tag-object.txt
# Attendu : b0d57168528cb1bd9c4b266e647f11a86bc1091e
git show-ref --verify refs/tags/melba-stable-20261024
# S'il existe déjà : contrôler sa cible et s'arrêter en cas de différence.
# S'il est absent seulement :
git update-ref refs/tags/melba-stable-20261024 b0d57168528cb1bd9c4b266e647f11a86bc1091e 0000000000000000000000000000000000000000
git push origin refs/tags/melba-stable-20261024
```

Les objets Git sont immuables ; une référence de tag ou de branche peut être modifiée/supprimée par un administrateur. Aucun ruleset distant n'a été créé ni sa disponibilité vérifiée. Une protection de tag interdisant modifications et suppression reste à configurer avec les droits adaptés. Ne pas présenter le tag distant comme terminé ou inviolable. La copie de l'objet permet sa récupération même si la référence locale disparaît.

## Reconstruction isolée

```sh
git archive --format=tar --output=melba-stable.tar 4960ca8dceb762dd55f2c166cf8333d53be0ad90
sha256sum melba-stable.tar
# aaa5267e275dbb0dc6a50e2e8bc7d43ea2acb74859a772b215230ee6c6ffa353
mkdir melba-stable-source
tar -xf melba-stable.tar -C melba-stable-source
cd melba-stable-source
npm ci
npm run check
npm test
npm run test:melba-flow
```
Node >=22 ; Playwright Chromium et dépendances PGlite nécessaires pour la dernière commande. Dans cette mission les dépendances/Chromium déjà installés ont été utilisés avec NODE_PATH et BROWSER_EXECUTABLE. Exécuter exclusivement les fixtures locales avec fournisseurs simulés, jamais des secrets réels. Netlify publie `site/`, fonctions `netlify/functions`, bundler esbuild, fichier catalogue inclus ; pas de commande de compilation front dans netlify.toml.

## Restauration opérationnelle, code seulement
1. Obtenir l'autorisation de restauration ; noter le déploiement actif et son SHA. Ne pas déplacer main, ne pas forcer une branche, ne pas démarrer d'instance parallèle.
2. Contrôler la compatibilité avec le schéma SQL et les services alors en place. Comparer tous les changements depuis la référence ; conserver les corrections de sécurité apparues ensuite. Le rollback automatique n'est pas sûr si le schéma ou les API externes ont changé.
3. Si le déploiement historique est encore conservé et compatible, sa republication dans **le même projet Netlify** est une option après contrôle. Sinon créer une branche depuis main, restaurer les fichiers applicatifs de la référence dans un nouveau commit contrôlé, tester puis intégrer et publier une fois après autorisation. Ne pas réécrire l'historique, ni réappliquer aveuglément toutes les migrations.
4. Conserver strictement la base et les données actuelles, les comptes Auth, les sessions fonctionnelles, les droits, les clés de signature/chiffrement et les connexions OAuth. Aucun seed, aucune réinitialisation, aucun import d'archive de test, aucun rejeu des notifications. Les rendez-vous et données clientes ne doivent pas être supprimés pour revenir à un code antérieur.
5. Vérifier pages, fonctions, calendrier et Manager sans créer de rendez-vous réel de test ni envoyer de messages. En cas d'incompatibilité, interrompre plutôt que modifier les données pour forcer la restauration.

## Ce que Git ne sauvegarde pas
- **Supabase** : données clientes, rendez-vous, lignes historiques de prestations, paramètres, file de tâches, configuration Auth et facteurs, schéma effectif/RLS, connexions Outlook chiffrées. Disponibilité d'un backup/PITR non vérifiée dans cette mission ; aucun backup réel créé. Prévoir selon le plan un backup/instantané et export chiffré dans un espace privé avec contrôle d'accès, rétention et test de restauration dans une base isolée. Ne jamais versionner un export réel dans ce dépôt.
- **Netlify** : valeurs secrètes et portée par contexte, configuration hors Git, état des déploiements et conservation des artefacts. Inventaire des noms ci-dessous ; exporter les secrets seulement via un coffre privé autorisé, jamais les afficher ou les mettre dans Git. Aucun secret n'a été lu/copié/modifié pour cette sauvegarde.
- **Outlook, Resend, Brevo, Anthropic** : consentements/tokens, calendrier et événements, configuration fournisseur, quotas, domaines et journaux. Prévoir leur propre continuité/retention et conservation sécurisée des identifiants. Une restauration de code ne recrée pas un consentement ou un événement disparu.

## Variables — noms seulement, issus du code stable
Aucune vérification des valeurs ni des portées actuelles n'est déduite de cette liste. Ne pas changer ces paramètres lors d'une restauration de code sans nécessité distinctement validée.

| Groupe | Variables et rôle |
|---|---|
| Environnement | `APP_ENV` séparation des gardes ; `SITE_URL` origine et liens ; `NATIVE_BOOKING_ENABLED` activation moteur ; `EXPECTED_SUPABASE_PROJECT_REF` garde d'isolement préproduction |
| Supabase | `SUPABASE_URL` projet ; `SUPABASE_PUBLISHABLE_KEY` Auth ; `SUPABASE_SECRET_KEY` accès serveur privilégié |
| Intégrité | `BOOKING_SIGNING_KEY` signatures ; `TOKEN_ENCRYPTION_KEY` chiffrement des tokens/contacts. Changer ces clés invalide des liens/sessions ou rend des tokens illisibles |
| Melba | `ANTHROPIC_API_KEY` appel modèle ; `ANTHROPIC_MODEL` modèle |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` OAuth ; calendrier/consentement stockés hors Git |
| Notifications | `RESEND_API_KEY`, `MAIL_FROM`, `BREVO_API_KEY` ; activations/préférences aussi en base |
| Test Outlook | `OUTLOOK_PREPROD_TEST`, `OUTLOOK_PREPROD_TEST_ACCOUNT` autorisation restreinte de préproduction ; ne pas les transposer à la production |

Secrets : conserver côté serveur/Functions et dans le contexte adapté, pas dans le bundle public. Une restriction effective de portée n'a pas été réalisée par cette mission. Aucun SIMPLYBOOK_* nécessaire dans le code stable analysé.
