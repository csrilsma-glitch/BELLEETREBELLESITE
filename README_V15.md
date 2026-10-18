# Belle & Rebelle V15 — livraison locale, sans publication

Cette archive contient le site existant, ses médias et son crâne interactif, les 64 prestations, le moteur natif Supabase, les fonctions Netlify, Melba/Claude raccordée au moteur, les notifications Brevo/Resend, l’intégration Outlook préparée et la PWA Manager privée.

**Ce livrable n’est pas une mise en service.** Aucune modification GitHub distante, aucun déploiement, aucune migration sur le vrai Supabase, aucun envoi de test et aucun consentement Microsoft n’ont été effectués pendant ce développement. Voir `docs/AUDIT_RECETTE.md` pour distinguer preuves locales et recette réelle restante.

## Sources et préservation

Dépôt audité avant modification : https://github.com/csrilsma-glitch/BELLEETREBELLESITE, commit `050c867a7550701b54bd7f104cff802a95456a24`. Les trois RAW joints correspondent octet pour octet à ses fonctions. Le dossier `site/` du ZIP V14 correspond au dépôt pour tous les fichiers communs ; le dépôt comporte en plus certains anciens médias. Ils sont conservés.

Le Word de transmission a été lu intégralement, tableaux compris, ainsi que le cahier des charges Claude et le document des 64 prestations. Les décisions finales Outlook/Brevo SMS/Resend remplacent les anciennes indications Google/SimplyBook. Aucun tarif ni durée inventé.

Melba garde son prompt original, sa personnalité, ses trois outils, la transmission des réclamations par Resend, son historique de session et sa boucle Claude. Ajout d’un raccord natif pour disponibilités et proposition de réservation. Le clic explicite de la cliente et la validation serveur créent le rendez-vous ; le modèle seul ne peut pas le créer en mode natif. Les originaux sont archivés dans `docs/`.

Le modèle d’origine `claude-haiku-5-5` est conservé par défaut. Sa disponibilité n’a pas pu être vérifiée avec la clé réelle ; `ANTHROPIC_MODEL` permet un réglage sans réécrire Melba. Ne pas basculer le chatbot vers des réponses locales simplifiées en cas d’erreur.

## Architecture

- `site/` : HTML/CSS/JS public, catalogue et médias inchangés.
- `site/manager/` : PWA indépendante par identité et périmètre, même serveur.
- `netlify/functions/` : API publiques validées, API Manager authentifiées, OAuth et traitements différés.
- `supabase/000_audit.sql` : inventaire en lecture seule du vrai projet.
- `001_v15.sql` à `004_privacy.sql` : tables isolées `br15_*`, transactions, RLS, import et protection des données.
- `tests/` : tests Node et tests PostgreSQL embarqué PGlite.

Les sept tables `br_*` existantes n’ont pas été modifiées ni présumées conformes. Le schéma séparé évite leur écrasement. Après lecture des résultats d’audit, décider de la reprise de leurs données ; il n’existe pas de migration automatique devinant leurs colonnes.

## Configuration serveur (aucun secret dans le navigateur)

Variables déjà mentionnées dans la transmission : `ANTHROPIC_API_KEY`, `BREVO_API_KEY`, `RESEND_API_KEY`, `SMS_ADMIN_TOKEN`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`.

Variables à ajouter :

| Nom | Usage |
|---|---|
| `SUPABASE_PUBLISHABLE_KEY` | Connexion Supabase Auth côté serveur, jamais la clé secrète à sa place |
| `BOOKING_SIGNING_KEY` | Secret aléatoire stable pour les liens de gestion ; au moins 32 octets aléatoires |
| `TOKEN_ENCRYPTION_KEY` | 32 octets aléatoires encodés en Base64 pour AES-256-GCM Outlook |
| `NATIVE_BOOKING_ENABLED` | `false` avant recette, `true` au basculement approuvé |
| `SITE_URL` | Origine HTTPS exacte, par défaut https://belleetrebelle-nailstudio.fr |
| `MAIL_FROM` | Belle & Rebelle <reservation@belleetrebelle-nailstudio.fr> |
| `ANTHROPIC_MODEL` | Facultatif ; identifiant de modèle compatible avec la clé réelle |

Générer les deux nouveaux secrets dans un gestionnaire de secrets, les enregistrer dans Netlify Functions ; ne pas les transmettre dans un chat, un Word ou un commit. La clé de signature doit rester stable pour conserver les liens existants. Sauvegarder les clés de façon privée. Les clés Supabase historiques JWT et nouvelles `sb_secret_` sont prises en charge côté REST.

## Mise en route et recette, dans l’ordre

1. Garder un export/snapshot de la production et du Supabase existant. Lire `000_audit.sql` sur le vrai projet et enregistrer ses résultats dans un emplacement privé. Aucun schéma de production n’a été inspecté ici.
2. Créer un environnement de recette isolé, avec sa base Supabase et ses variables propres. Exécuter les migrations dans l’ordre numérique ; vérifier 64 services et les permissions. Le réimport catalogue ne remplace pas les modifications faites dans le Manager (`ON CONFLICT DO NOTHING`).
3. Configurer Auth, désactiver inscriptions publiques, autoriser l’UUID de Mélanie et tester TOTP. Voir `docs/MANAGER_INSTALLATION.md`. Pas de compte ni mot de passe précréé dans cette archive.
4. Renseigner les vrais horaires (aucune plage n’est ajoutée automatiquement), pauses, marge, règles d’incompatibilité, délai d’annulation et information clientèle. Les valeurs 120 minutes, 24 heures et 365 jours sont des propositions techniques à confirmer, pas des décisions métier validées. Les SMS sont désactivés par défaut pour maîtriser les crédits.
5. Tester la réservation multiple en recette et les collisions, annulation, déplacement, liens expirés, accès Manager. Les prix/durées sont calculés à partir de la base, figés dans chaque réservation, jamais acceptés du navigateur. Les modifications de durée du catalogue peuvent nécessiter une intervention de Mélanie pour déplacer un ancien RDV.
6. Activer `NATIVE_BOOKING_ENABLED=true` et le réglage `enabled` **dans l’environnement de recette seulement**. Les deux sont nécessaires. Le Manager ne peut pas ouvrir les réservations si horaires ou information clientèle sont absents.
7. Vérifier avec accord les notifications reçues : un seul test Resend à la cliente et à Mélanie ; réutiliser la preuve Brevo existante et ne pas envoyer des SMS de test inutiles. Une réservation est confirmée dès son enregistrement ; les notifications partent par file différée, au passage du cron (toutes les cinq minutes) ou depuis le Manager. Le statut « envoyé » signifie accepté par le fournisseur, pas livré ; aucun webhook de livraison n’est intégré.
8. Connecter Outlook seulement après disponibilité du callback sur l’environnement autorisé et consentement de Mélanie. L’URI production prévue est `https://belleetrebelle-nailstudio.fr/.netlify/functions/outlook-callback` ; celle d’un test doit également être inscrite dans Entra. Scope délégué `offline_access Calendars.ReadWrite`, comptes personnels, code/state consommé une fois, PKCE, jetons chiffrés. Sélectionner explicitement le calendrier dédié modifiable, jamais le calendrier par défaut.
9. Tester création/déplacement/annulation dans Outlook et renouvellement/révocation des jetons. Le site pousse ses réservations vers Outlook ; les événements manuels de cet agenda bloquent les disponibilités lors de la synchronisation. **Modifier/supprimer dans Outlook une réservation créée par le site ne modifie pas Supabase** : utiliser le Manager pour ces actions. Les conflits de périodes manuelles sont signalés. Synchronisation toutes les cinq minutes, pas instantanée. L’option `outlook_required` suspend les nouvelles disponibilités si la dernière synchronisation date de plus de dix minutes ou signale une erreur.
10. Faire valider la recette et le basculement par le propriétaire. Arrêter les nouvelles réservations SimplyBook avant le rapprochement final ; exporter ses RDV futurs, les vérifier et bloquer/reprendre ces plages dans le natif. Ne jamais laisser deux calendriers accepter des RDV simultanément sans ce rapprochement. Les réservations SimplyBook ne sont pas automatiquement importées.
11. Après validation native, lancer localement `node scripts/finalize-native.js --validated` : retrait de l’ancien adaptateur et des pages de secours. Relancer tous les tests et comparer les archives. Le script ne déploie rien. Ne pas supprimer `send-sms.js` ni son fonctionnement testé.
12. Présenter le ZIP validé et obtenir l’accord de publication. Seulement ensuite pousser/déployer, configurer les variables de production et exécuter la migration approuvée. Contrôler les tâches planifiées Netlify : elles ne tournent que sur un déploiement publié, jamais dans ce ZIP. Installer le Manager depuis son URL HTTPS après cette étape.

## API et sécurité

`catalog` ne retourne que les services actifs et les informations publiques. `availability` ne retourne ni cliente ni libellé privé d’occupation. `reservations` crée, consulte via jeton signé, annule ou déplace ; jeton dans le fragment du lien et corps POST, jamais dans une URL d’API. `manager-auth` traite mot de passe et TOTP ; `manager` vérifie Auth puis l’allowlist et `aal2` avant tout accès aux clientes. Cookies HttpOnly/Secure/Strict et aucune donnée cliente dans les caches PWA/localStorage. Session non renouvelée automatiquement : reconnexion après expiration.

Limitation persistante des demandes via Supabase, contrôles d’origine, taille/format/coordonnées. Auth a ses propres protections en plus des limites applicatives ; le rate limit applicatif dépend d’une base disponible et ne remplace pas la protection réseau de l’hébergeur. Aucun CAPTCHA n’est activé par défaut. Les identifiants d’administration ne sont pas publiés.

Réservation et lignes figées dans une seule transaction SQL ; verrou commun avec modifications d’horaires/blocages et contrainte d’exclusion PostgreSQL. Clé d’idempotence unique, calcul serveur, contrôle des pauses, congés et dates Paris. Les liens d’annulation expirent sept jours après la fin et le délai d’annulation est contrôlé serveur ; déplacement actualise l’expiration. Pas de compte cliente obligatoire, pas d’acompte.

La file est transactionnelle et les prises de jobs utilisent `SKIP LOCKED`. Resend utilise une clé d’idempotence. Brevo conserve l’endpoint/expéditeur déjà testés ; un timeout ou un crash d’envoi SMS devient `uncertain`, sans relance automatique pouvant doubler un SMS. Les refus identifiés et les e-mails sont retentés avec temporisation et plafond. Vérifier les journaux avant une relance manuelle ; aucune garantie « exactement une fois » ne peut être affirmée pour un fournisseur SMS sans preuve de réception idempotente. Les anciennes tâches de rappel sont invalidées après déplacement/annulation.

Les données personnelles ne sont pas inscrites dans les logs techniques. Notes internes : limiter au nécessaire. L’anonymisation d’une fiche est explicite et irréversible, refusée si un RDV futur confirmé existe. La durée de conservation est un paramètre à formaliser et appliquer par procédure documentée ; aucun effacement automatique n’est programmé avant décision métier. Export privé depuis le Manager ; protéger les fichiers exportés. La politique publique définitive, le responsable du traitement et les obligations de conservation restent à compléter par Mélanie.

## Vérifications reproductibles

Node 22 ou 24, puis :

```bash
npm ci
npm run check
npm test
npm run test:sql
```

`test:sql` utilise PostgreSQL embarqué (PGlite avec btree_gist) sur une base temporaire, pas Supabase production. Les tests navigateur décrits dans le rapport utilisent Chromium, trois tailles et fournisseurs simulés. Ils ne prouvent ni la réception de messages ni OAuth réel. Les originaux média et les fichiers de police sont conservés ; la preuve de licence web commerciale October Crow reste à fournir.

## Retour arrière

Avant mise en production, conserver un ZIP/commit exact de l’ancienne production et un export chiffré de la base. Tant que le natif n’a pas accepté de vrais RDV, remettre ce ZIP et les variables précédentes suffit pour le site. Après réception de vraies réservations natives, ne pas rouvrir SimplyBook avant rapprochement des rendez-vous et blocage des plages : restaurer des fichiers n’annule ni SMS, ni e-mails, ni événements Outlook. Ne jamais supprimer les tables `br15_*` pour revenir en arrière ; les fermer avec `enabled=false`, arrêter le traitement des tâches concernées et préserver les données pour reprise.

Les fichiers originaux `chat.js`, `send-sms.js` et `simplybook.js` sont archivés en texte dans `docs/`. L’ancien `send-sms.js` reste un endpoint de test manuel protégé par `SMS_ADMIN_TOKEN`, aucun envoi n’est lancé par sa présence. Éviter de l’invoquer par automatisme.

Tests navigateur reproductibles, avec réponses fournisseurs simulées :

```bash
npx playwright install chromium
npm run test:browser
```

Ou définir `BROWSER_EXECUTABLE` vers un Chromium déjà installé. Les captures et fixtures sont locales dans `test-results/`, exclues de Git. Ces tests ne contactent pas vos services réels.
