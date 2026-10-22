# Causes racines

## Vérifiées

- **M01** : `chat.js` appelle bien `booking.availability` puis les RPC natives `slots` et `quote`. Le défaut se situait dans la restitution : même sans appel d’outil, le texte libre du modèle était signé puis affiché. Les outils n’écrivent pas directement une réservation : `book_appointment` prépare une proposition ; le clic cliente appelle le serveur de réservation.
- **M02** : le prompt ne distinguait pas clairement abandon de conversation et annulation réelle. Aucun chemin court ne protégeait les formulations explicites d’abandon. Aucun outil Claude d’annulation n’existe : prétendre qu’il aurait annulé serait faux.
- **M03/M04** : pas de date courante Europe/Paris injectée, ni de résolution déterministe du prochain jour/mois, ni d’état signé minimal de préférence/date alternative. Le modèle choisissait seul les arguments de date.
- **U01** : affichage sécurisé via `textContent`, mais absence de traitement des `**…**` dans les réponses.
- **U02** : les boucles des deux fichiers JavaScript produisaient autant de boutons que de créneaux ; les pas de cinq minutes viennent du moteur et restent inchangés.
- **U03** : une requête asynchrone pouvait se terminer après un changement de date ou un abandon. Un chargement du catalogue pouvait aussi réactiver un ancien bouton de confirmation.

## Hypothèses et limites

- Impossible d’attribuer l’ancienne réponse à un appel précis Claude ou à une panne Outlook sans traces de la conversation. Aucune cause fournisseur n’est affirmée.
- Le réseau, Supabase et les fournisseurs sont simulés dans les tests navigateur. Les SQL sont réellement exécutés dans PGlite local.
- Les garde-fous textuels hors résultat d’outil neutralisent les formulations dangereuses couvertes, mais ne constituent pas une preuve exhaustive sur toutes les paraphrases possibles d’un modèle génératif. La contre-vérification doit conserver des cas adversariaux. Les propositions structurées et les écritures, elles, repassent obligatoirement par le moteur.
