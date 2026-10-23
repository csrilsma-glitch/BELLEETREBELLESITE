> Historique de la version 01a9ecd, refusée par le second contre-audit. Voir `07_REPONSE_CONTRE_AUDIT_2.md` pour la nouvelle proposition et les preuves.

# Phase 1 — Réponse Work au contre-audit Claude

23 octobre 2026. **Validation indépendante encore attendue. Aucune fusion ni livraison.**

Base corrigée : PR #3, commit `a27f935d7093df4374c19004613d177899532141`, issue de `main` `bb4bf6f`.
Contre-audit lu intégralement : branche `docs/rapport-erreurs-conception-20261023`, commit `22f02e71e5b033d9ae4abbf048fea3c5f770edea`, fichier `contre-audit-pr3.md` et deux scripts adversariaux `preuves-pr3/`.

## Corrections et preuves

| ID | Symptôme et cause vérifiée | Correction | Test intégré |
|---|---|---|---|
| HTN-ERR-066 | Heures en lettres, midi, jours et assertions de réservation contournent le filtre initial | Détection élargie hors résultat d’outil : une à douze heures, autres heures usuelles, midi/minuit, chiffres, jours et assertions. Aucun texte libre ne remplace le résultat structuré lorsqu’un outil a été exécuté. Les paramètres connus ne sont pas redemandés. « Paiement sur place » préservé. | Les six phrases exactes de Claude, les heures, les sept jours, texte commercial innocent, paramètres déjà connus et preuve structurée |
| HTN-ERR-067 | Raccourci d’abandon ancré uniquement en début de message | Raccourcis limités au message complet, avec seules formules de politesse finales admises. Nouvelle demande, date, « plutôt », « mais », « et » ou plainte restent confiées au modèle. Même règle pour la demande d’annulation sécurisée. | Abandon pur et demandes mixtes, dont les deux phrases originales de Claude |
| HTN-ERR-068 | Jour de semaine absent de la résolution ; mémoire prioritaire par défaut dans l’outil | Résolution des jours et « prochain » à Paris ; dernière expression temporelle explicite prioritaire. Source de date identifiée côté serveur ; dernier message prioritaire sur contexte signé. Un ancien champ requestedDate non qualifié ne remplace plus la nouvelle date outil. Date explicite invalide : clarification, pas de retour silencieux à la mémoire. | Dates/jours/année/Paris, script original outil cas A, outil de proposition et handler avec contexte signé + changement de jour, date invalide |
| HTN-ERR-069 | Heure sans préposition prise pour une préférence, même dans une durée | Heure utilisée uniquement après à/vers/entre/de ; contexte immédiatement associé à soin/prestation/durée/travail/pose exclu. Préférences explicites conservées. | « 1h30 de soin », « de 1h30 de soin », heures seules, prépositions, matin/après-midi |
| HTN-ERR-070 | Boucle de sept alternatives, répétable à chaque tour d’outil | Trois jours alternatifs maximum ; zéro appel sans préférence ; plafond de quatre consultations partagé entre tous les outils d’une requête, proposition comprise. Au plafond : réponse de limite, sans prétendre à une panne ni à un enregistrement. | 0 puis 4 appels, deuxième recherche refusée, budget partagé entre check et proposition, script original cas B |

Tests intégrés : `tests/melba-counteraudit.test.js` (10 tests). L’ancienne fixture de date de `melba-reliability.test.js` indique maintenant explicitement qu’elle représente la date résolue du dernier message. L’attente de texte du garde-fou reflète la nouvelle réponse prudente.

## Exécutions réalisées

| Suite | Résultat |
|---|---|
| Node | **168/168**, dont 10 nouveaux tests HTN-ERR-066 à 070 |
| Contrôle syntaxique/catalogue | 38 fichiers JS ; 64 prestations |
| SQL PGlite | Tous réussis : multi-prestations, durées/prix, conflits, pauses, déplacements/annulations, droits et Paris |
| Rappels + mise à niveau locale | Réussis ; aucune migration hébergée |
| Navigateur site | Quatre viewports ; réservation multiple, crâne, annulation, Manager, 12 MP4 originaux et coexistence des deux PWA réussis |
| Navigateur Manager | Cinq configurations réussies |
| Navigateur ergonomie | 96 créneaux, 390/820/1440 px, clavier et courses réseau réussis |
| Navigateur MFA simulée | Premier facteur, facteur existant et deux exceptions de connexion simulées réussis ; aucun vrai compte connecté ou modifié |
| Navigateur récupération | Neuf parcours simulés réussis |
| Scripts Claude originaux | Avant/après exécutés sur deux arbres distincts : les six phrases sont désormais bloquées ; demandes mixtes non absorbées ; jeudi résolu ; cas A consulte la nouvelle date ; cas B passe de 8 à 4 consultations |

Les sorties sont dans `preuves-correctifs-066-070/`. Le commentaire « plafond attendu ~8 » du script Claude est conservé dans la sortie historique ; la nouvelle limite est bien **4 au total = 1 date + 3 alternatives**.

Environnement : Node 24.19.0, Playwright 1.62.1, Chromium 153.0.8010.0, PGlite local. La récupération a d’abord échoué faute de chemin Chromium dans la commande ; elle a ensuite été exécutée avec le binaire disponible et a réussi. Cet incident de lancement n’était pas une anomalie applicative. Une première assertion a également révélé que « paiement sur place » était trop largement filtré : corrigé, test conservé et vert.

## Périmètre et limites

Pas de changement du moteur SQL, de `lib/booking.js`, du Manager, des workers, des médias, des intégrations ou de l’authentification depuis `a27f935`. Aucun fournisseur réel appelé, aucune notification, aucun événement Outlook, aucune donnée cliente réelle ni réglage de production modifié. Les sorties MFA masquent les adresses des comptes autorisés.

Les tests navigateur utilisent les API simulées. Les nouveaux comportements serveur sont vérifiés par Node avec outils simulés et par les scripts adversariaux originaux. Pas de requête réelle Anthropic, de test de charge PostgreSQL distant, de téléphone physique ou de Safari/Edge distinct. La couverture du filtre textuel est testée sur les cas répertoriés ; elle ne prouve pas toute paraphrase possible d’un modèle génératif. Claude doit conserver son contrôle indépendant et ajouter tout contournement trouvé.

## Organisation de validation

1. PR en brouillon, marquée `[skip netlify]`. Demande unique : **VALIDER — TRANSMETTRE À CLAUDE POUR CONTRE-AUDIT**.
2. Après cette validation, Work finalise la référence à transmettre ; Claude dépose son verdict et les références exactes sur GitHub.
3. Tout refus critique implique correction et nouveau contrôle.
4. Fusion/déploiement seulement après verdict favorable et seconde validation utilisateur consignée. Vérifier alors que l’arbre validé est identique à celui à livrer.
5. Après les deux validations : Work fusionne, surveille Netlify et contrôle le site, sans notifications réelles de test. Si régression critique publiée, correction ou revert ciblé suivi d’un nouveau déploiement ; ne pas restaurer aveuglément un ancien état de données.

Cette phase ne constitue **ni un verdict favorable de Claude ni une autorisation de déploiement**.
