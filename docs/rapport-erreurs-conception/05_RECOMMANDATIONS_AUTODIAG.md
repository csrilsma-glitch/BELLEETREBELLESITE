# Recommandations AutoDiag — matière première pour HOTANOVA

Ce dossier ne développe ni ne prétend installer AutoDiag. Claude assure la contre-vérification, la consolidation et le développement ultérieur.

| Anomalie | Sonde de prévention recommandée | Preuve attendue |
|---|---|---|
| M01 | Injecter une réponse IA avec horaire inventé sans outil, avec outil vide puis avec panne | Aucune disponibilité non justifiée ; seuls les résultats moteur apparaissent |
| M02 | Envoyer abandon, changement d’avis, plainte réelle et annulation d’un rendez-vous | Abandon sans action ; erreur pertinente reconnue ; vraie annulation avec preuve serveur et lien autorisé |
| M03 | Horloge injectée : veille/jour/lendemain, changement d’année, date passée, 29 février et Paris été/hiver | Date et jour cohérents, aucune année devinée erronée |
| M04 | Réponse matin puis nouvelle date, alternative acceptée, contexte modifié et signé invalide | Pas de question répétée, pas de date héritée contre la demande, contexte falsifié ignoré |
| U01 | Réponse avec Markdown et HTML malveillant | Pas de marqueur gras brut ni exécution HTML |
| U02 | Alimenter 0/1/96 créneaux sur plusieurs viewports | Choix accessible, hauteur bornée, focus, aucune sélection automatique dangereuse |
| U03 | Inverser l’ordre de réponses réseau, retarder catalogue et disponibilité, changer de date | Ancienne réponse non actionnable, aucun ancien horaire restauré |

Préférer des contrats structurés pour les actions métier : consultation, proposition, consentement, écriture et confirmation doivent rester distincts. Une phrase du modèle n’est ni une preuve d’écriture ni un événement métier.

Mesures non sensibles envisageables : nombre d’appels d’outil, résultat disponible/vide/erreur, type de garde-fou activé, durée technique et version. Ne pas conserver par défaut de coordonnées, conversations complètes, liens de gestion, secrets ou QR codes. Compter les déclenchements du garde-fou pour repérer une dégradation du prompt sans exposer de clientes.

Les sondes doivent utiliser une base et des prestataires fictifs avec une interdiction réseau explicite vers les fournisseurs. Les déploiements d’essai doivent rester désactivés tant que leur isolation n’est pas vérifiée.
