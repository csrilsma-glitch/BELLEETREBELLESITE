# Vérification finale — Melba et menus déroulants

**Date :** 23 octobre 2026
**Commit contrôlé :** `135e084` (Work) + correctif `5f26654` (Claude, branche de la PR #3)
**PR :** https://github.com/csrilsma-glitch/BELLEETREBELLESITE/pull/3

## Résultats

| Demande | Résultat | Preuve |
|---|---|---|
| Melba : disponibilités réelles avant toute proposition ou confirmation | OK | Garde-fou : les affirmations d'heure, de jour ou de réservation sans résultat d'outil sont bloquées (y compris « c'est réservé », « c'est noté »). |
| Melba : dates | OK | « vendredi » un vendredi → semaine suivante ; « demain » puis « plutôt vendredi » → vendredi suivant ; « aujourd'hui vendredi » → aujourd'hui. |
| Melba : durées et préférences | OK | « un soin de 1h30 » → pas de préférence ; « à 10h » → matin ; « vers 15h » → après-midi ; « le soin dure 1 heure » → autorisé. |
| Melba : pas de confirmation fausse | OK | Une réservation n'est annoncée qu'après le clic de confirmation (tests et sondes). |
| Melba : personnalité et fonctionnalités | OK | Aucun changement du prompt ni des outils dans `135e084` ; 174 tests Node réussis. |
| Menus déroulants : réservation et déplacement client | OK | `targeted-ui` : 96 créneaux en menu, clavier, invalidation, à 820 et 1440 px. |
| Menus déroulants : Manager | OK | `manager-ui` réussi. |
| Parcours PWA, vidéos, MFA, récupération | OK | `browser.cjs`, `mfa-ui`, `recovery-browser` réussis (vidéos : shims WebM, voir limites). |

## Tests exécutés

- `node --test tests/*.test.js` : 174/174
- `tests/sql.test.cjs`, `tests/reminders-lifecycle.test.cjs`, `scripts/check.js` : OK
- Suites navigateur : `browser`, `targeted-ui`, `manager-ui`, `mfa-ui`, `recovery-browser` : OK
- Adversariaux : `adversarial-policy.cjs` et sondes de date, durée et garde : tous les cas attendus

## Limites

- Chromium de l'environnement ne décode pas le H.264 : les vidéos ont été testées avec des copies WebM générées à partir des MP4 du dépôt.
- Aucun test sur appareil physique (Android, iPhone), aucun test de production, aucun envoi réel Outlook, Resend ou Brevo.
- La branche `main` n'est pas modifiée. Aucune fusion, aucun déploiement.

## Points hors périmètre de cette demande

- HTN-ERR-063 : informations juridiques à compléter avant lancement public (bloquant).
- HTN-ERR-029 et 061 : exception MFA pour deux comptes et protection des mots de passe divulgués désactivée (risques acceptés, à résorber).

## Verdict

- Melba : **OK**
- Menus déroulants : **OK**
- Prêt pour mise en ligne des correctifs de la PR : **OUI**, sous réserve des points hors périmètre ci-dessus et de votre autorisation de fusion et de déploiement.

Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019r5RCHqu7JcRJ3bzgKx3v4
