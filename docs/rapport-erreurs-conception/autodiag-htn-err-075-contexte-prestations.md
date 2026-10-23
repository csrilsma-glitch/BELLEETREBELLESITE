# AutoDiag — HTN-ERR-075 : prestation nommée non retenue par l'assistant

**Statut :** corrigé dans la branche de la PR #3 (`17f1c32`), à déployer par Work ; vérification en production à faire après déploiement.
**Source :** test réel sur PWA Android, 23 octobre 2026.

## Scénario reproduit
1. Cliente : « Bonjour je veux réserver pour un kit press nails complet uniquement ».
2. Assistant : demande quelles prestations sont souhaitées (**défaut**).
3. Cliente : « Matin ». Assistant : retient le matin, mais redemande encore les prestations (**défaut**).

## Cause
- Le contexte signé ne transportait ni les prestations ni la date de la conversation.
- La consigne du prompt demande de « demander famille puis prestation » : le modèle reposait la question même quand la prestation était nommée.
- Aucune reconnaissance serveur des noms du catalogue.

## Correctif (commit `17f1c32`)
- Reconnaissance des prestations depuis le catalogue (nom du service).
- « kit complet uniquement » → `press-kit-seul` ; « kit complet » seul → demande de précision (deux prestations).
- Prestations rappelées au modèle et conservées dans le contexte signé.
- Date seule manquante → réponse serveur directe.

## Contrôles AutoDiag (à rejouer à chaque site)
| # | Message | Attendu |
|---|---|---|
| 1 | Nom d'une prestation complète | Prestation reconnue, pas de question sur la famille |
| 2 | Nom ambigu (« kit complet ») | Précision seulement, liste des deux prestations |
| 3 | Prestation puis préférence (« matin ») | Préférence retenue, seule la date est demandée |
| 4 | Date donnée ensuite | Recherche réelle, prestation reprise du contexte |
| 5 | Choix d'un créneau (« 10h40 ») | Vérification réelle, coordonnées demandées, aucune réservation affirmée |

## Règle de prévention
Tout nom de prestation ou de préférence déjà donné est retenu côté serveur dans le contexte signé, et jamais redemandé par le modèle.

## Test de non-régression
`tests/melba-press-context.test.js` (conversation exacte) — échoue sur la version précédente.
