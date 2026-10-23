# Modes de Melba : conseil et réservation (livrés sur `fix/20261024-melba-catalogue-complet`)

Ce n'est pas une anomalie : fonctionnalité demandée par le propriétaire (captures « Le futur fonctionnement de Melba »).

- **Accueil :** une salutation seule (« Bonjour ») répond : « Bonjour ! Vous avez besoin d’un conseil ou vous souhaitez réserver ? »
- **Mode conseil :** déclenché par « conseil », « conseiller », « lequel me… », « laquelle me… ». Réponse du modèle **sans outil** (aucun créneau, aucune réservation, aucune coordonnée demandée). Annonce : « Je passe en mode conseillère. »
- **Mode réservation :** déclenché par « réserver », « réservation », « rendez-vous », « rdv ». Le parcours déterministe de Work reprend. Annonce si on quitte le conseil : « Je passe en mode agent de réservation. »
- **Réservation conservée :** le passage en conseil ne réinitialise ni la prestation, ni la date, ni l'horaire déjà validés. Une réponse de réservation pendant le conseil reçoit « Votre réservation en cours est conservée… ».
- **Données personnelles :** les messages marqués privés ne sont jamais envoyés au modèle de conseil.
- **Plafond IA :** la salutation est comptée comme les autres messages.

Limites : le passage de mode repose sur des mots-clés explicites ; le modèle de conseil est simulé dans les tests ; le ton réel reste à vérifier sur téléphone.
