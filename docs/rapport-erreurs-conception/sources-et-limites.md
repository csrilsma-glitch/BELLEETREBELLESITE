# Sources lues et limites de vérification

## Documents lus pour constituer ce dossier (23 octobre 2026)

Tous les documents de `docs/` ont été lus, à l'exception des fichiers suivants, traités autrement :

- `docs/INVENTAIRE_V15.json` : inventaire des fichiers (empreintes), consulté par son en-tête. Non utilisé comme source d'erreur.
- `docs/supabase/recuperation-manager-email-fr.html` : gabarit d'e-mail de récupération, non lu en entier (aucune erreur de conception identifiée à partir de ce gabarit).
- `docs/COMPARAISON_V14.txt` : fichier vide, sans contenu.
- `docs/send-sms-original.js.txt` : lu, secrets masqués. Le contenu n'est pas reproduit dans ce dossier.
- `docs/validation/20261020-auth.json` et `20261020-live-bookings.json` : résultats booléens et identifiants fictifs, lus pour leurs conclusions.

Documents principaux consultés :

- `AUDIT_RECETTE.md` (19 octobre)
- `PREPRODUCTION_20261019.md`, `ETAT_NUIT_2026-10-19.md`
- `MANAGER_INSTALLATION.md`, `OUTLOOK_PREPROD_TEST.md`, `supabase/REGLAGES_SUPABASE_PREPROD.md`
- `validation/20261020-preproduction.md`, `20261020-evening.md`, `20261020-auth.json`
- `validation/20261021-*` : work, consolidation, finalisation, juridique, migrations, pwa-install, pwa-production, pauses-outlook, outlook-pause-reel, tarifs-manager, production-go, abandon-service-externe
- `validation/20261022-finalisation-production.md`, `20261022-manager-password-only.md`

## Vérifications dans le dépôt

Le dépôt a été cloné en lecture seule (`csrilsma-glitch/belleetrebellesite`, branche `main`). Le clone a été rattrapé en historique borné pour que les commits cités soient présents. Vérifications réalisées :

| Vérification | Résultat |
|---|---|
| Commits cités présents dans l'historique de `main` | Oui, pour les commits listés dans le registre |
| Drapeau `PREPROD_REAL_TEST` dans les fichiers de fonctions, site et tests | Absent |
| Identifiant de bloc de test codé en dur | Absent de `netlify/`, `site/`, `tests/` |
| Endpoint SMS `send-sms.js` | Remplacé par une réponse HTTP 410 (différent de l'original documenté) |
| Liste d'exception MFA (`PASSWORD_ONLY_MANAGERS`) | Présente dans `netlify/functions/lib/core.js` |
| Validateurs de date et d'instant | Présents dans `core.js` (format strict, décalage explicite exigé) |
| Garde de référence du projet Supabase | Présente dans `core.js` (`EXPECTED_SUPABASE_PROJECT_REF`) |
| Migration de sauvegarde des horaires | `WHERE id IS NOT NULL` présent |
| Révocation de la fonction RLS | Présente dans `supabase/production/` |
| Déplacement de l'extension `btree_gist` | Présent dans `supabase/production/` et `supabase/migrations/` |

## Limites

1. **Production non revérifiée.** Aucune requête n'a été faite à la production. Tous les constats de production sont repris des rapports datés, à confirmer.
2. **Pull Requests non consultables.** La session n'a pas accès à l'API GitHub. La Pull Request de ChatGPT Work n'a pas été examinée.
3. **Appareils physiques.** Aucun test sur Android ou iPhone réel. Toutes les mentions « testé » pour la PWA et l'installation signifient « simulé dans un navigateur ».
4. **Données clientes.** Aucune donnée réelle n'a été lue ni reproduite. Les identifiants de réservation, numéros, adresses et jetons ont été omis volontairement.
5. **Rapports antérieurs.** Plusieurs rapports ont été corrigés par leurs auteurs au fil des jours (par exemple la mention d'un fichier « inchangé », ou celle d'un envoi « non réalisé »). Ce dossier suit la version la plus récente vérifiée, et signale les corrections.
6. **Cause non confirmée.** Les entrées marquées H ne doivent pas être corrigées sur la seule foi de ce dossier ; elles demandent une reproduction.

## Règles d'enrichissement

- Une nouvelle entrée reçoit le numéro suivant (`HTN-ERR-074` et suivants) ; une entrée n'est jamais supprimée.
- Chaque entrée cite au moins une source (document, commit, migration) et ne contient aucune donnée réelle.
- Le statut est mis à jour quand une vérification change la situation ; l'ancien statut reste visible dans l'historique du fichier Git.
- Les entrées issues de la PR #3 (contre-audit de Work, 23 octobre) portent la référence de la PR et du commit.

## Revue de la PR #3 (23 octobre 2026)

- Branche `fix/20261023-melba-creneaux`, commit `a27f935`, base `bb4bf6f` : diff vérifié (28 fichiers).
- `node --test tests/*.test.js` : 158/158. `scripts/check.js`, `tests/sql.test.cjs`, `tests/reminders-lifecycle.test.cjs` : réussis.
- Navigateur (`test:browser`, `test:manager`, `test:targeted-ui`, `test:mfa-ui`) : non reproduit, Chromium indisponible dans cette session ; sorties de Work conservées dans `preuves-pr3/`.
- Cas adversariaux : `preuves-pr3/adversarial-policy.cjs` et `adversarial-tools.cjs` (usage : `PR_DIR=<checkout> node …`).
