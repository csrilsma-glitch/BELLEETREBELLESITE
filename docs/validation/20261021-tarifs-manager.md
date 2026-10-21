# Validation des tarifs Manager — 21 octobre 2026

Périmètre : préproduction uniquement, Supabase xrpjrweqdhihloykabml. Application déployée 770b0cd. Aucun changement en production, aucun message réel, aucune écriture Outlook.

## Vérifications réalisées

- Manager authentifié : 64 formulaires de prestations et 64 champs de prix. Modification réelle du Gel sans rallongement de 52,00 à 53,25 euros par le formulaire, sans intervention technique.
- Écriture Supabase confirmée : 5325 centimes.
- Site de préproduction rechargé : le sélecteur crâne affiche 53,25 euros, identité visuelle préservée.
- Réservation de trois prestations gel-gainage, deco-simple-unite, fc-2 : total actualisé 59,25 euros, durée inchangée 110 minutes ; devis SQL identique.
- Réponse réelle de Melba interrogée sans demande de réservation : 53,25 euros.
- Empreinte de tous les montants et prestations des rendez-vous antérieurs identique avant/après : 63b98ec53747ecf9ec2a1702655e4967.
- Nouvelle réservation fictive via API déployée, retour 201 : montant 53,25 euros. Tarif catalogue restauré à 52 euros par le Manager ; la réservation conserve 53,25 euros lors de la consultation puis après déplacement. Réservation fictive ensuite annulée, statut annule confirmé en base.
- Contrôle final : catalogue 5200 centimes ; empreinte des rendez-vous antérieurs toujours identique, en excluant la nouvelle réservation fictive.

## Régression automatisée

Ajout dans tests/sql.test.cjs : modification du prix via br15_admin(service), nouveau devis actualisé, réservation antérieure inchangée, montant et prestations conservés après déplacement. Suite SQL PGlite exécutée avec succès avec toutes les migrations.

## Portée et limite

L'autonomie de modification est présente : aucune correction du code applicatif ni redéploiement nécessaire. Tous les formulaires utilisent le même chemin de sauvegarde ; une prestation a été modifiée réellement, pas les 64 tarifs. Les pages chargent le catalogue à leur ouverture/rechargement ; ceci ne constitue pas une validation de mise à jour automatique des onglets déjà ouverts. Le domaine officiel n'a pas été testé ni modifié. Cette validation concerne le site public de préproduction.
