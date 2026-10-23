# Anomalies constatées — 23 octobre 2026

Référence : `main` à `bb4bf6f33dfb31a2967555624b9fca22e5fa7eff`.
Branche : `fix/20261023-melba-creneaux`. Aucun déploiement ni changement des services réels.
Les captures annoncées dans la demande ne sont pas disponibles dans les fichiers de cette session. Les constats ci-dessous distinguent les défauts du code et les comportements rapportés.

| ID | Priorité | Symptôme / composant | Preuve et état |
|---|---|---|---|
| M01 | P1 | Melba peut afficher un horaire non issu d’un outil | Vérifié dans le code initial : le texte final Claude était transmis sans rapprochement avec les résultats. Une simulation de réponse inventée est désormais neutralisée. Corrigé localement. |
| M02 | P1 | Changement d’avis suivi d’une justification technique ou d’une fausse annulation | Comportement rapporté ; absence de règle dédiée vérifiée. Réponses d’abandon explicite testées sans IA, notification ou annulation. Corrigé localement. |
| M03 | P1 | Date sans année / jour de semaine erroné | Absence de date courante explicite vérifiée. Résolution Paris, dates explicites passées et jour calculé testés. Corrigé localement. |
| M04 | P1 | Préférence matin / après-midi oubliée ou redemandée | Aucune étape serveur dédiée auparavant. Préférence conservée dans un petit contexte signé ; alternative consultée avant proposition. Corrigé localement. |
| U01 | P2 | Doubles astérisques visibles | `textContent` affichait volontairement le texte brut, sans conversion Markdown. Retrait des marqueurs gras appariés, sans interprétation HTML. Corrigé et testé en navigateur. |
| U02 | P1 | Grille démesurée de créneaux | Boucle créant un bouton par créneau dans réservation, déplacement cliente et déplacement Manager. Menus natifs compacts ; 96 options testées à 390/820/1440 px. Corrigé localement. |
| U03 | P1 | Ancien choix / ancienne réponse redevenant actionnable | Défense absente dans le code initial : réponse tardive après nouvelle date ou nouveau message. Générations de requête et invalidation des propositions ajoutées. Tests d’invalidation et scénarios de courses dédiés. |

Pas de preuve tirée de l’aveu d’un modèle : une phrase où Melba reconnaît une erreur ne prouve pas à elle seule que l’ancien calendrier a réellement été consulté ou ignoré. Aucun journal client n’a été extrait pour reconstruire la conversation.

Le moteur SQL, les droits Manager, les deux exceptions MFA existantes, Outlook, Resend et Brevo ne sont pas modifiés par cette branche. Les correctifs de sécurité du dossier local d’audit du 22 octobre ne sont pas inclus dans cette PR ciblée.
