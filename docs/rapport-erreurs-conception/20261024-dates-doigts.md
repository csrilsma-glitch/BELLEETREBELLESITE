# AutoDiag — précisions dates et quantités de doigts

## MELBA-DATE-CLARIFY-20261024
Symptôme : un jour seul peut recevoir un mois/une année supposés. Cause vérifiée : appel abbreviatedDate avec prochaine occurrence future, comportement ancien devenu contraire à la nouvelle consigne. Correction : état déterministe de provenance/parties de date ; calendrier seulement après résolution. Tests : melba-clarifications.test.js et navigateur associé ; mois seul puis année, contexte explicite, mois passé,14h, reload. Prévention : différencier types heure/jour/date complète et tracer leur provenance sans données personnelles.

## MELBA-FINGER-NUMBER-20261024
Symptôme : variantes numériques/singulières moins bien reconnues que libellés du catalogue. Cause vérifiée : comparaison lexicale des mots/noms de feuilles sans équivalence ciblée. Correction : normalisation limitée 2/4/6doigt(s) et filtrage sur la feuille réelle ; combinaison inexistante ou ambiguë non sélectionnée automatiquement. Tests :12variantes mots/nombres/pluriel, famille successive, famille absente,3doigts refusé,64feuilles/cumuls conservés. Prévention : matrice de variantes par attribut métier, jamais conversion arbitraire de tous les nombres ni création d'un tarif implicite.

Preuves détaillées : docs/validation/20261024-melba-sauvegarde-clarifications.md. Corrigé localement, PR pour revueClaude ; pas en production. Fournisseurs simulés, pas de données clientes. Les identifiants datés évitent les collisions avec le registre HTN.
