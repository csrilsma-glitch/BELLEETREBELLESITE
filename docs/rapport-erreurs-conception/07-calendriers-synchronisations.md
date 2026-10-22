# 07 — Calendriers et synchronisations

Principe : le site écrit ses réservations dans un **calendrier dédié non principal**. Les événements occupés placés par la gérante dans ce calendrier deviennent des indisponibilités. La synchronisation est **périodique** (cinq minutes), jamais instantanée, et **n'est pas bidirectionnelle** pour tous les types d'objets.

## HTN-ERR-032 — Doublons ou boucle d'import Outlook

- **Symptôme :** un même rendez-vous apparaît plusieurs fois, ou un événement créé par le site est réimporté comme indisponibilité en boucle.
- **Cause :** risque identifié à la conception : import de ses propres événements.
- **Impact :** calendrier encombré, créneaux bloqués à tort. Gravité élevée.
- **Détection :** compter les événements par identifiant de réservation dans le calendrier et dans la table de correspondance.
- **Réparation :** anti-boucle : les événements créés par le site sont identifiés et ignorés à l'import ; une seule correspondance par réservation ; numéro de révision à chaque modification.
- **Prévention :** tout objet synchronisé porte une correspondance unique (objet local, identifiant externe, révision).
- **Test :** 105 tests Node dont un test anti-boucle ; test réel sur le calendrier dédié (20 et 21 octobre) : un seul événement pour une réservation de trois prestations, modification avec même identifiant, zéro doublon.
- **Statut :** corrigé ; testé sur calendrier de test.
- **Traçabilité :** `docs/validation/20261020-evening.md` ; `docs/validation/20261021-consolidation-en-cours.md` ; `docs/validation/20261021-outlook-pause-reel.md`.

## HTN-ERR-033 — Bloc supprimé dans Outlook non retiré de la base

- **Symptôme :** un événement d'indisponibilité supprimé dans Outlook reste bloquant sur le site.
- **Cause :** risque de conception : la suppression externe n'était pas propagée.
- **Impact :** créneaux disponibles bloqués à tort. Gravité moyenne.
- **Détection :** supprimer un événement de test, puis contrôler la disponibilité du créneau au passage suivant.
- **Réparation :** suppression logique (marqueur de révision) ; le créneau redevient disponible au passage suivant.
- **Prévention :** toute suppression externe est un événement de synchronisation à part entière.
- **Test :** test réel du 20 octobre (événement supprimé, bloc disparu au passage suivant) ; test réel du 21 octobre (modification puis suppression).
- **Statut :** corrigé ; testé sur calendrier de test.
- **Traçabilité :** `docs/validation/20261020-evening.md` ; `docs/validation/20261021-outlook-pause-reel.md`.

## HTN-ERR-034 — Pauses Manager non exportées vers Outlook

- **Symptôme :** une pause créée dans le Manager n'apparaît pas dans le calendrier Outlook.
- **Cause :** démontrée par la lecture du code (21 octobre) : une pause Manager n'a pas de tâche d'export ; l'export n'a été activé que pour un bloc de test identifié.
- **Impact :** la gérante peut ignorer une pause en regardant Outlook. Le site et l'agent la respectent immédiatement. Gravité moyenne.
- **Détection :** créer une pause dans le Manager et contrôler le calendrier.
- **Réparation :** partielle : export limité à un bloc de test explicitement configuré. **Décision à prendre avant lancement** : export généralisé ou communication claire de la limite.
- **Prévention :** documenter pour chaque type d'objet le sens de synchronisation (site → Outlook, Outlook → site, ou aucun).
- **Test :** création, modification et suppression d'une pause de test, vérification dans Outlook.
- **Statut :** non résolu (limitation connue à trancher).
- **Traçabilité :** `docs/validation/20261021-pauses-outlook.md`.

## HTN-ERR-035 — Modification directe d'un rendez-vous dans Outlook non répercutée

- **Symptôme :** si la gérante déplace un rendez-vous directement dans Outlook, le site ne suit pas la modification.
- **Cause :** conception : Outlook n'est pas une commande de modification du site.
- **Impact :** désynchronisation possible entre le calendrier et la base. Gravité moyenne.
- **Détection :** déplacer un événement de réservation dans Outlook et contrôler la base.
- **Réparation :** aucune. Consigne : modifier le rendez-vous depuis le Manager.
- **Prévention :** consigne dans la documentation de la gérante ; contrôle périodique des écarts.
- **Test :** déplacement dans Outlook, constat de l'écart, puis contrôle que la base n'a pas changé.
- **Statut :** non résolu (limitation connue, documentée).
- **Traçabilité :** `docs/AUDIT_RECETTE.md` ; `docs/validation/20261021-pauses-outlook.md`.

## HTN-ERR-036 — Délai de synchronisation Outlook (cinq minutes)

- **Symptôme :** une modification n'apparaît pas immédiatement dans l'autre sens.
- **Cause :** conception : synchronisation périodique.
- **Impact :** délai d'environ cinq minutes, plus en cas de file chargée. Gravité faible.
- **Détection :** mesurer le délai entre une action et sa répercussion.
- **Réparation :** aucune. Délai documenté.
- **Prévention :** informer la gérante et la cliente du délai ; ne pas promettre d'instantanéité.
- **Test :** mesure du délai pendant les essais réels.
- **Statut :** à surveiller (comportement attendu).
- **Traçabilité :** `docs/validation/20261020-evening.md`.

## HTN-ERR-037 — Événement d'essai créé dans le calendrier de travail

- **Symptôme :** un événement de test « TEST » a été créé pour une pause fictive, en plus de l'événement voulu, dans le calendrier de la gérante.
- **Cause :** démontrée (21 octobre). La variable de configuration annoncée comme créée n'était pas présente à la relecture, et la garde qui devait limiter l'essai à un seul bloc était optionnelle. Le premier passage a donc traité une seconde pause existante.
- **Impact :** événement parasite dans un calendrier professionnel réel. Gravité élevée (incident réel, sans conséquence client constatée).
- **Détection :** comparer les événements créés par le test avec la liste attendue ; relire la configuration après chaque écriture.
- **Réparation :** événement supplémentaire identifié par sa correspondance et supprimé ; pause d'origine conservée. La garde est devenue obligatoire : sans identifiant exact, l'essai est différé sans écriture (commits `95b84301` et `bd9f7aaa`). Suppression du fallback codé en dur (voir HTN-ERR-038).
- **Prévention :** toute opération d'écriture sur un calendrier réel exige une garde qui échoue fermée (refus par défaut). Ne jamais déduire d'une réponse d'écriture que la configuration est active.
- **Test :** 106 tests Node, dont un test de garde sur l'identifiant unique ; relecture de la configuration après écriture.
- **Statut :** corrigé ; testé. Incident documenté.
- **Traçabilité :** `docs/validation/20261021-outlook-pause-reel.md` ; commits `95b84301`, `bd9f7aaa` (présents sur `main`).

## HTN-ERR-038 — Identifiant de test codé en dur

- **Symptôme :** un identifiant de bloc de test était écrit en clair dans le code, ce qui permettait une écriture sur un élément précis.
- **Cause :** démontrée par la revue du 21 octobre.
- **Impact :** risque de réutilisation du code de test sur un autre élément. Gravité moyenne.
- **Détection :** recherche de l'identifiant dans le code.
- **Réparation :** fallback supprimé ; l'identifiant doit être fourni par la configuration.
- **Prévention :** aucune constante de test dans le code de production ; revue automatisée de recherche d'identifiants.
- **Test :** recherche de l'identifiant dans les dossiers `netlify`, `site` et `tests` de `main` : **aucune occurrence** (vérifié le 23 octobre 2026).
- **Statut :** corrigé ; vérifié dans le code actuel.
- **Traçabilité :** `docs/validation/20261021-outlook-pause-reel.md` ; `tests/block-outlook.test.js`.

## HTN-ERR-039 — Choix de calendrier : homonyme ou calendrier principal

- **Symptôme :** le site pourrait écrire dans le calendrier principal de la gérante, ou dans un calendrier portant le même nom.
- **Cause :** risque de conception identifié à la préparation de la préproduction.
- **Impact :** écriture dans le calendrier personnel. Gravité élevée.
- **Détection :** vérifier le nom, le caractère non principal et les droits d'écriture du calendrier choisi ; détecter les homonymes.
- **Réparation :** calendrier dédié unique ; refus des écritures vers tout autre calendrier ; détection des homonymes ; verrou de préparation.
- **Prévention :** choisir le calendrier par identifiant, jamais par nom seul.
- **Test :** tests d'isolation des calendriers (21 octobre) ; contrôle réel sur le calendrier de test.
- **Statut :** corrigé ; testé.
- **Traçabilité :** `docs/validation/20261021-finalisation.md` ; `docs/validation/20261021-production-go.md`.

## HTN-ERR-040 — Réglage `outlook_required` différent selon l'environnement

- **Symptôme :** en préproduction, une panne Outlook n'empêche pas les réservations ; en production, si le réglage est actif, aucune réservation n'est acceptée tant que le calendrier n'est pas connecté.
- **Cause :** décision de configuration, différente selon l'environnement. Non tranchée pour le lancement.
- **Impact :** comportement différent entre tests et production. Gravité moyenne.
- **Détection :** comparer le réglage dans chaque environnement.
- **Réparation :** décision à prendre par la gérante.
- **Prévention :** tout réglage qui conditionne une réservation doit être noté dans la checklist de lancement, avec la valeur attendue.
- **Test :** tester une indisponibilité Outlook simulée dans chaque mode.
- **Statut :** non résolu (décision en attente).
- **Traçabilité :** `docs/validation/20261021-production-go.md` ; `docs/validation/20261022-finalisation-production.md`.
