# Recommandations AutoDiag — sondes de prévention issues de la PR #3

Matière première pour le module AutoDiag de HOTANOVA. Chaque sonde doit tourner **localement**, sans crédit Netlify, sans appel de modèle réel, et sur des données fictives. Les sondes s'exécutent avec une interdiction réseau explicite vers les fournisseurs.

## Sondes issues de la PR #3

| Réf. | Erreur | Sonde | Preuve attendue | Statut de la sonde |
|---|---|---|---|---|
| HTN-ERR-066 | Affirmation de disponibilité sans outil | Injecter une réponse modèle contenant une heure, un jour ou une réservation, sans résultat d'outil, et avec un outil vide puis en panne | Aucune affirmation non justifiée ne sort ; seul le texte canonique est renvoyé | À écrire (cas adversariaux prêts dans `preuves-pr3/`) |
| HTN-ERR-067 | Abandon court-circuitant une demande | Envoyer abandon seul, abandon suivi d'une demande, annulation suivie d'une demande, plainte réelle | Abandon seul : réponse courte sans action ; autre cas : transmis au modèle | À écrire |
| HTN-ERR-068 | Date mémorisée écrasant la demande | Horloge injectée : veille, lendemain, changement de jour de semaine, changement d'année, 29 février, passage à l'heure d'été | La date interrogée correspond au dernier message | À écrire (cas A prêt) |
| HTN-ERR-069 | Durée prise pour une préférence | Phrases avec durées (1h30, 2h) et heures réelles (à 10h, vers 15h) | Une durée ne fixe jamais une préférence | À écrire |
| HTN-ERR-070 | Coût de recherche en cascade | Compter les appels de disponibilité par demande, dans trois scénarios : créneau trouvé, aucun créneau, panne | Nombre d'appels ≤ plafond défini (3 jours) | À écrire (cas B prêt) |
| HTN-ERR-071 | Markdown affiché brut | Réponse avec `**gras**`, `<script>`, HTML malveillant | Pas de marqueur brut ; aucun HTML exécuté | Couvert par les tests Work (navigateur) |
| HTN-ERR-072 | Grille de créneaux démesurée | Alimenter 0, 1 et 96 créneaux sur 390, 820 et 1440 px | Menu natif, hauteur bornée, focus visible, aucun débordement | Couvert par les tests Work (navigateur), à relancer |
| HTN-ERR-073 | Réponse ou proposition tardive actionnable | Inverser l'ordre des réponses réseau, retarder catalogue et disponibilité, changer de date entre deux appels | Aucune ancienne proposition cliquable ; aucun ancien horaire restauré | Couvert par les tests Work, à relancer |

## Principes d'architecture à réutiliser

1. **Séparer consultation, proposition, consentement, écriture et confirmation.** Une phrase du modèle n'est ni une preuve de disponibilité, ni une écriture, ni un événement métier. Seuls les résultats du moteur comptent.
2. **Une seule source de vérité pour la date de référence.** Le dernier message fait foi ; un état mémorisé ne remplace jamais une date explicite.
3. **Un raccourci ne couvre jamais un message porteur d'une demande.** Abandon, annulation, aide : seulement quand le message se limite à cette intention.
4. **Budget d'appels par requête** : plafond de consultations au calendrier, compté et testé. Une alternative se cherche sur une fenêtre courte, jamais sur sept jours à chaque appel.
5. **Échec fermé** : en cas de panne d'un outil, aucune disponibilité n'est affirmée.
6. **Contexte minimal signé** : seules la date et la préférence voyagent entre deux appels, sans coordonnées. Toute signature invalide efface le contexte.

## Mesures non sensibles à collecter

- Nombre d'appels d'outil par requête.
- Résultat de chaque outil : disponible, vide, erreur.
- Type de garde-fou activé (affirmation, abandon, date passée, panne).
- Durée technique et version de la fonction.

À **ne pas** conserver par défaut : coordonnées, conversations complètes, liens de gestion, secrets, QR codes. Le compteur de déclenchements du garde-fou sert à repérer une dégradation du prompt sans exposer aucune cliente.

## Règles pour les futurs templates HOTANOVA

- Chaque agent conversationnel a une liste de cas adversariaux versionnée, exécutée à chaque publication.
- Chaque numéro de téléphone, adresse ou identifiant métier est lu depuis la configuration, jamais écrit dans le code.
- Les sondes d'AutoDiag ne tournent que sur base et prestataires fictifs, avec un drapeau de simulation qui ne peut pas être activé par une donnée client.
- Un déploiement d'essai reste désactivé tant que son isolation n'est pas vérifiée (référence du projet attendue, comparaison booléenne des variables).

## Limites

Les sondes décrivent ce qu'il faut vérifier. Elles ne sont pas encore écrites pour AutoDiag, qui n'existe pas encore. Les garde-fous textuels ne prouvent pas l'exhaustivité face à toutes les paraphrases d'un modèle génératif : la défense principale reste la structure (outils, contrats, confirmation explicite).
