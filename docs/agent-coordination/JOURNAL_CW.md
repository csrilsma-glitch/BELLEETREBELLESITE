# Journal CW

Historique chronologique et permanent. **Ne jamais écraser une entrée existante.** Toute nouvelle entrée est ajoutée en bas, identifiée par mission et auteur.

---

## 2026-10-23, 21:26 (Europe/Paris) — CLAUDE — Installation du protocole RAPPORT CW

- **Mission :** installation intégrale du protocole documentaire CW.
- **Problème initial :** pas de source de vérité partagée entre Claude et ChatGPT Work ; les missions passaient par des messages non traçables.
- **Cause identifiée (fait) :** absence de dossier de coordination sur GitHub.
- **Actions effectuées :** création de `docs/agent-coordination/` avec les cinq fichiers du protocole ; initialisation du journal ; enregistrement de CW-001 à CW-005 ; branche documentaire `docs/protocole-rapport-cw`, indépendante de la PR #7.
- **Fichiers modifiés :** `docs/agent-coordination/PROTOCOLE_CW.md`, `RAPPORT_CW.md`, `MISSIONS_CW.md`, `JOURNAL_CW.md`, `BLOCAGES_CW.md`.
- **Tests :** sans objet (documentation uniquement).
- **Statut final :** `TERMINEE` pour l'installation, sous réserve de publication effective sur GitHub.

---

## 2026-10-23 (Europe/Paris) — CLAUDE — Correctif de la boucle Melba (CW-001)

- **Problème initial :** après « babyboomer 2 doigts », puis « 10h40 », Melba relançait la liste des horaires et redemandait la prestation.
- **Cause identifiée (fait vérifié) :** la reconnaissance des prestations (`matchServices`, `netlify/functions/lib/melba-policy.js`) ne comparait que le nom des prestations, pas leur catégorie. « babyboomer » n'était donc reconnu nulle part. La prestation n'entrait pas dans le contexte signé, et la sélection d'horaire ne pouvait pas être traitée.
- **Reproduction (fait vérifié) :** séquence « babyboomer 2 doigts » → « Le mardi 27 octobre » → « Matin » → « 10h40 » : même liste d'horaires renvoyée avant correctif.
- **Actions effectuées :** normalisation des formulations (« baby boomer », « 2 / 4 / 6 doigts ») ; départage par la catégorie ; test de régression `tests/melba-babyboomer-services.test.js`.
- **Fichiers modifiés :** `netlify/functions/lib/melba-policy.js` ; `tests/melba-babyboomer-services.test.js` (nouveau) ; `docs/validation/20261023-babyboomer-services.md` (nouveau).
- **Branche et commits :** `fix/20261023-melba-babyboomer-services`, commit `6bf3a31`.
- **PR :** #7 vers `main`, non fusionnée.
- **Tests :** 2/2 avec correctif ; 0/2 sans correctif ; `npm test` 195/195.
- **Problèmes encore présents :** perte de la conversation au rafraîchissement de la PWA (CW-003) ; aucun test sur la PWA réelle ni sur Supabase.
- **Statut :** `A_VERIFIER_WORK`.

---

## 2026-10-23, 21:24 — CLAUDE — Nettoyage

- **Constat :** une tentative précédente d'installation du protocole avait créé des fichiers non suivis.
- **Action :** suppression de ces fichiers et de la branche locale associée, à la demande de l'utilisateur.
- **Statut :** `TERMINEE`. L'installation est reprise intégralement dans l'entrée ci-dessus.
