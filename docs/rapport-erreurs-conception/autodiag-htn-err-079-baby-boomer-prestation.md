# AutoDiag — HTN-ERR-079 : « Baby boomer » non reconnue, question de prestation répétée

Constaté par le propriétaire sur le site public (Android), 24 octobre 2026, 00h22–00h23 : « Je veux réserver » → Melba demande la prestation ; « Baby boomer » → Melba redemande « Quelle prestation souhaitez-vous réserver ? ».
Reproduit à l'identique sur `098f2e5` avec le gestionnaire HTTP réel (`baby.cjs`) : deux réponses « Quelle prestation », modèle appelé deux fois, prestation absente du contexte signé.

## Cause réelle
- Le catalogue (`site/assets/prestations.json`) donne aux feuilles des noms courts : « Deux doigts », « Quatre doigts », « Six doigts », « Mains complètes ». Le nom de la famille « Babyboomer / babycolor » n'est que dans le chemin (`path`).
- `matchServices` ne comparait que le nom de la feuille. « Baby boomer » ne correspondait à aucune prestation ; le message partait vers le modèle, qui reposait la question.
- Le nom composé « babyboomer » du catalogue ne correspond pas à « baby boomer » tapé avec un espace.

## Correction
- Les segments de famille du chemin sont lus ; « baby boomer » reconnaît la famille (en accolant les mots voisins et en traitant les alternatives « A / B »).
- Famille seule : précision déterministe « Dans « Babyboomer / babycolor », quelle option souhaitez-vous : Deux doigts, Quatre doigts, Six doigts, Mains complètes ? », sans appel au modèle.
- Réponse « Quatre doigts » ensuite : résolue dans la famille annoncée (`familyHint`), la prestation `bb-4` est enregistrée dans le contexte signé.
- Le message d'après : « Quelle date vous conviendrait ? » seulement. La période (matin ou après-midi) vient après le calendrier.
- Noms identiques d'une famille à l'autre (« Quatre doigts ») : libellé complété par la famille.

## Tests de non-régression
- `tests/melba-baby-modes.test.js` : parcours « Je veux réserver » → « Baby boomer » → « Quatre doigts » → « Le 26 octobre » ; prestation enregistrée (`bb-4`) ; aucun appel au modèle pour la précision ; aucune écriture `book`. Échoue sur `ebe34e0` (4 échecs).
- « Babyboomer mains complètes » reconnu directement.
- Ambiguïté générale (« kit complet ») inchangée.

## Détection automatique
Pour chaque famille du catalogue, envoyer son nom seul puis un des noms de prestation : la prestation doit être retenue ou la précision de famille proposée ; jamais « Quelle prestation » une seconde fois.

## Limites
- Le modèle est simulé dans les tests.
- Les autres prestations de famille ne sont testées que par la logique générique ; une vérification manuelle de chaque famille est à faire sur téléphone.
