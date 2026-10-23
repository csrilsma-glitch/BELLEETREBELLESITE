# RAPPORT CW — point d'entrée unique

**Projet :** Belle & Rebelle — Melba entièrement fonctionnelle
**Dernière mise à jour :** 2026-10-23, 21:26 (Europe/Paris), par CLAUDE
**Branche de ce rapport :** `docs/protocole-rapport-cw` (indépendante de la PR #7)

---

## État général

- Le protocole CW est installé dans `docs/agent-coordination/`.
- Le correctif de la boucle Melba (« babyboomer 2 doigts » puis « 10h40 ») est poussé et ouvert en PR #7. Il attend l'audit de ChatGPT Work.
- Aucun déploiement en production.
- Points ouverts : perte de la conversation au rafraîchissement de la PWA (CW-003), vérification Supabase / Outlook / Resend / Brevo (CW-004), plan de déploiement (CW-005).

## Dernière transmission

- **Auteur :** CLAUDE
- **Mission :** CW-001 — correctif de la boucle Melba
- **Branche :** `fix/20261023-melba-babyboomer-services`
- **Commit :** `6bf3a31`
- **PR :** #7 vers `main`, non fusionnée
- **Problème initial :** après « babyboomer 2 doigts » puis « 10h40 », Melba relançait la liste des horaires.
- **Cause identifiée (faits vérifiés) :** la reconnaissance des prestations ne comparait que le nom, pas la catégorie ; « babyboomer » n'était donc pas reconnu.
- **Tests :** 195/195 ; 2 tests de régression échouent sans correctif et passent avec.
- **Limites :** calendrier et modèle simulés ; pas de test sur la PWA réelle ni sur Supabase.
- **Rapport détaillé :** `docs/validation/20261023-babyboomer-services.md`

## Agent attendu

**CHATGPT WORK** — audit indépendant de la PR #7 (mission CW-002).

## Priorités

1. CW-002 : audit de la PR #7 par Work.
2. CW-003 : perte de la conversation au rafraîchissement de la PWA (Claude).
3. CW-004 : vérification Supabase, Outlook, Resend, Brevo (Work).
4. CW-005 : plan de déploiement et retour arrière (Work, sans déploiement).

## Prochaines missions

Voir `MISSIONS_CW.md`.

## Rapports existants (référencés, non dupliqués)

- `docs/rapport-erreurs-conception/` — anomalies, causes racines, correctifs, tests, recommandations AutoDiag.
- `docs/validation/` — rapports de validation datés, dont `20261023-babyboomer-services.md`.

## Décision attendue de l'utilisateur

Aucune pour l'instant. La fusion et le déploiement restent soumis à votre autorisation explicite.
