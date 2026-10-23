# Troisième version proposée — après le contre-audit de 01a9ecd

23 octobre 2026. **À contre-vérifier par Claude. Aucun verdict favorable, aucune fusion ni livraison.**

Branche existante : `fix/20261023-melba-creneaux`, PR #3.
Base : `01a9ecdac34c419f8127486b2547b9300de94ead`.
Rapport de Claude lu intégralement : `contre-audit-2-01a9ecd.md`, commit documentaire `0ff894d`.
Les conclusions favorables de Work dans le rapport précédent ne suffisaient pas : le refus de Claude est confirmé par les reproductions ci-dessous.

## Corrections ciblées

| Point | Cause vérifiée | Correction | Preuve |
|---|---|---|---|
| HTN-ERR-069 | Seuls les mots après l’heure étaient examinés ; « soin de 1h30 » était pris pour « de 1h30 » | Extraction dédiée `startHour` : repère aussi le contexte avant l’heure, ignore une durée puis poursuit la recherche d’une vraie heure de départ. Matin/après-midi explicites prioritaires. Une expression durée/plage ambiguë reste à clarifier. | Positions début/milieu/fin, cinq mots de durée, « un soin de 1h30 le matin », « vers 15h », plages matin et après-midi après une durée. Pour « soin de 2h, de 10h à 12h », l’heure retenue est **10**, pas 2 ; pour « soin de 2h, de 15h à 17h », **15**, pas 2. |
| HTN-ERR-074 | Le calcul modulo sept acceptait zéro pour un jour nu égal au jour courant | Jour de semaine seul : occurrence strictement future, donc +7 le jour même. « Aujourd’hui » explicite et date chiffrée conservent leur sens. | Matrice **7×7**, jours identiques, changements semaine/mois/année et « aujourd’hui, plutôt vendredi ». |
| HTN-ERR-066 | Formules sans nom « rendez-vous » et sans heure absentes du filtre | Neutralisation de « c’est réservé », « c’est noté », « c’est bon pour vous », « tout est confirmé/enregistré », « je l’ai noté » et variantes. Résultats d’outils et proposition restent des réponses canoniques ; une consultation n’est pas un enregistrement. | Phrases exactes de Claude et variantes, avec/sans outil, proposition non confirmée ; tests HTTP sans aucun outil ni écriture. « Paiement sur place » reste autorisé. |
| HTN-ERR-068 | Ancien script d’outil sans dateSource non représentatif du handler | Initialisation extraite en `planningContext`, appelée par le véritable handler après vérification de signature. Le nouveau cas A appelle **le véritable handler**, sans remplacer son initialisation. | Horloge Paris figée au 23/10/2026, contexte signé du 24, messages « demain matin » puis « plutôt vendredi », vrai tour d’outil simulé : `dateSource=latest`, date résolue et effectivement consultée **2026-10-30**. |

Tests ajoutés : `tests/melba-reaudit.test.js` (**six tests**, plusieurs dizaines de sous-cas/assertions). L’attente ancienne « dimanche le jour même » dans `melba-counteraudit.test.js` est alignée sur la nouvelle règle explicite. Aucun ancien scénario n’a été retiré.

## Preuve reproductible avant/après

`preuves-contre-audit-3/regressions-sur-01a9ecd.txt` : les six nouveaux tests échouent sur un worktree détaché de `01a9ecd`. Les échecs portent sur les comportements (durée, jour, affirmation et date consultée), pas sur l’absence du nouveau helper.

`regressions-corrigees.txt` : six tests réussis après correctifs. `cas-a-http.txt` isole la preuve HTTP et la trace non personnelle du calendrier.

Depuis le checkout corrigé :

```sh
node --test tests/melba-reaudit.test.js
node --test --test-name-pattern='HTTP réel cas A' tests/melba-reaudit.test.js
git worktree add --detach ../baseline-01a9ecd 01a9ecdac34c419f8127486b2547b9300de94ead
BR_REAUDIT_ROOT="$(cd ../baseline-01a9ecd && pwd)" node --test tests/melba-reaudit.test.js
```

La dernière commande doit échouer ; elle charge les modules de l’ancienne version tout en utilisant les nouveaux tests. Aucune clé réelle n’est requise. Le contexte signé utilise une clé fictive locale ; aucune requête n’atteint Anthropic, Supabase, Outlook ou un fournisseur de notifications.

## Résultats réellement exécutés

| Suite | Résultat et portée |
|---|---|
| Node | **174/174**, dont les six nouvelles régressions |
| Check | 38 fichiers JS ; 64 prestations |
| SQL PGlite | Tous réussis : réservations multiples, cumuls, collisions, horaires/pauses, annulation/déplacement, tarifs historiques et protections |
| Rappels et mise à niveau locale | Réussis ; aucune base hébergée modifiée |
| Navigateur site | Quatre tailles d’écran ; moteur et fournisseurs simulés ; crâne, réservation, annulation, Manager, coexistence des deux PWA et caches |
| Manager | Cinq configurations réussies |
| Ergonomie | Trois largeurs, 96 créneaux, clavier, invalidation et réponses tardives : réussis |
| MFA / récupération | Parcours simulés réussis, neuf parcours de récupération ; aucun compte réel connecté ou modifié |
| Vidéos | **12 fichiers MP4 originaux H.264** : métadonnées et démarrage de lecture réussis dans Chromium 153.0.8010.0, navigation/relecture/pause/ressources/erreur-réessai réussis, **sans shim WebM** |

Environnement : Node 24.19.0, Playwright 1.62.1, Chromium 153.0.8010.0. Les commandes et sorties sont dans `preuves-contre-audit-3/`.

## Précision sur les vidéos

La commande navigateur a explicitement défini `VIDEO_SHIM_DIR=`. La suite affiche désormais son mode effectif : si un autre environnement fournit des shims, elle annonce « copies WebM — logique uniquement, H.264 non validé ». C’est une amélioration de preuve, pas un changement du lecteur ou des médias.

`codecs-originaux.json` contient pour chaque MP4 son codec relevé par ffprobe, son empreinte SHA-256 et la vérification de son identité avec l’objet Git de la base. Les 12 sont H.264 et inchangés. Aucun fichier source n’a été converti ou remplacé. La lecture de chaque vidéo n’a pas été suivie pendant sa durée intégrale ; il s’agit du décodage/démarrage et des comportements couverts par la suite. Aucun test physique Android/iPhone ni Safari/Edge distinct : aucune validation universelle n’est revendiquée.

Le second audit de Claude utilisait des copies WebM : sa preuve validait la logique, pas H.264. Cette limite et la preuve originale de cette nouvelle exécution restent distinguées.

## Périmètre, réserves et suite

Aucune modification du SQL, du moteur de réservation, des droits Manager, de l’exception MFA, des intégrations, des workers, des médias ni de la configuration Netlify. Les seuls changements applicatifs concernent Melba et l’extraction de son contexte. Le changement de sortie dans `tests/browser.cjs` est justifié par la demande de preuve codec. Aucun déploiement, notification réelle, événement Outlook ni donnée cliente réelle.

Le sur-blocage signalé par Claude (« Le soin dure 1 heure », « Vous pouvez prendre place ») demeure volontairement inchangé et documenté : ne pas prétendre qu’il a été corrigé. Les formulations naturelles non répertoriées restent à soumettre au contrôle indépendant ; les tests ne prouvent pas toutes les paraphrases d’un modèle. Les résultats SQL locaux ne sont pas un test de charge multi-processus du PostgreSQL de production.

**Action suivante : troisième contre-audit Claude sur le nouveau commit exact de la PR #3.** Ne pas fusionner et ne pas déployer avant son verdict favorable et les validations prévues. Ce rapport Work ne vaut pas validation de déploiement.
