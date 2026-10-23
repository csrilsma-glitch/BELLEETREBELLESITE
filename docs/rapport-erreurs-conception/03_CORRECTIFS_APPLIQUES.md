# Correctifs appliqués sur la branche

## Melba

`netlify/functions/lib/melba-policy.js` et `chat.js` :

- personnalité, modèle configuré, trois outils Claude, catalogue vivant, plafonds IA et signatures conservés ;
- date courante et jour de semaine calculés en Europe/Paris ; prochain jour/mois sans année, demain/après-demain, année explicite passée refusée ;
- sélection courante du crâne transmise au serveur et identifiants validés, puis fournie explicitement au modèle pour éviter une perte de contexte ;
- préférence matin/après-midi demandée avant proposition ; conserver une préférence déjà donnée ;
- restitution des créneaux construite à partir des résultats réels de l’outil courant, au maximum quatre propositions espacées ;
- zéro créneau : recherche bornée à trois jours suivants, avec quatre consultations maximum partagées par requête, sans inventer une alternative ; si aucune alternative n’est trouvée, demander une autre date ;
- contexte minimal signé (date et préférence, sans coordonnées) pour conserver une alternative ; contexte falsifié ignoré ;
- panne technique : message prudent, aucune disponibilité inventée ;
- proposition revérifiée avec toutes les prestations, les durées et la préférence ; seul le résultat positif du serveur après clic confirme l’enregistrement ;
- abandon explicite bref et chaleureux, sans action métier. Une plainte signalant une véritable erreur reste traitée honnêtement ;
- demande d’annulation réelle renvoyée vers le lien sécurisé existant ; aucune fausse annonce d’annulation ;
- horaires habituels restitués séparément à partir des horaires Manager, avec distinction explicite entre ouverture et créneau libre.

`site/assistant.js` : texte toujours sûr avec `textContent`, marqueurs gras appariés retirés ; anciennes propositions désactivées au message suivant ; réponses tardives et chargements tardifs ignorés.

## Créneaux et ergonomie

`site/reservation.js` : menu `<select>` natif avec label, choix initial obligatoire et groupes Matin / Après-midi pour créer et déplacer. Tous les créneaux serveur restent proposés : aucun changement du pas SQL ni de la capacité de réservation. Changement de date/prestation invalide le choix et une réponse de recherche devenue obsolète.

`site/manager/manager.js` : déplacement via select et confirmation explicite ; changement de date invalide la recherche. La création Manager utilisait déjà un select : conservée.

CSS : identité conservée, hauteur tactile et focus visible. Le sélecteur crâne n’est ni aplati ni remplacé.

Caches publics et Manager versionnés pour une future livraison. Manifestes, périmètres et worker de B&R APP conservés ; son parcours ouvre la même page de réservation corrigée. Aucune donnée privée ajoutée au cache.

## Sélecteurs examinés et conservés

- Prestations publiques : menu natif existant, liste repliée — conservé.
- Arborescence du crâne : interaction structurée — conservée.
- Manager, mode agenda et calendriers Outlook : menus natifs — conservés.
- Manager, prestations multiples : liste native de hauteur bornée à sept lignes — conservée ; remplacer cet outil serait une évolution distincte.

Aucune migration SQL, variable Netlify, clé, donnée réelle ou configuration d’authentification modifiée. Aucune nouvelle dépendance.

## Complément après contre-audit

Voir `06_REPONSE_CONTRE_AUDIT_066_070.md` pour les corrections supplémentaires, les nouvelles preuves et les limites. Le verdict initial Claude était défavorable ; son nouveau contrôle reste attendu.
