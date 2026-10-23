# CW-005 — Plan préparé, NON exécuté

Auteur Work, 23 octobre 2026. Aucune autorisation actuelle de fusionner PR #7/#8 ou de déployer en production.

1. Après accord explicite désignant PR et commit : fetch, lire coordination, vérifier main et production Netlify. Référence applicative constatée : ccd4ed4 / deploy 6adb33732ee47b285459e856.
2. Vérifier HEAD PR #7, diff (pas de tarifs/sécurité/données), absence de conflits et correspondance du SHA aux preuves. Si HEAD change, revoir les modifications concernées.
3. Créer référence Git de sauvegarde au SHA réellement publié. Aucun export de données clientes requis pour ce changement de code sans migration.
4. Exécuter les tests pertinents du SHA final ; pas d'envoi réel ni écriture en production pendant la recette. Confirmer que l'environnement isolé ne charge aucun secret réel.
5. Fusion autorisée par Work, puis un déploiement Git regroupé sur le projet existant. Pas de nouveau site ni modification de secrets/paramètres de sécurité. Éviter les builds documentaires avec [skip netlify].
6. Vérifier ready, commit_ref exact, HTTPS, fichiers et cache, parcours jusqu'au récapitulatif sans confirmer, et accès non authentifié refusé aux API Manager.
7. Une confirmation, un SMS, un e-mail ou un événement réel exige son accord spécifique. Rien n'est implicitement autorisé par le protocole.
8. Si build échoue avant publication, ancienne version reste active. Si régression critique après publication : arrêt des essais, preuve sans secret, revert ciblé du code et redéploiement dans l'autorisation de retour arrière ; ne pas réécrire l'historique ni les données.
9. Consigner déploiement réel et différences entre SHA main et dernier SHA applicatif publié ; publier la transmission et proposer la suite, attendre validation.
