# Installation du Manager V15

Correctif ciblé après 2db8e875b0f2643f86f2dc797cec91951b1eeb8d. Aucun fichier serveur, donnée ou réglage métier modifié.

## Diagnostic
Dans Chrome cloud, le clic de l'ancien bouton affiche uniquement une phrase générique dans le statut de connexion. Aucun beforeinstallprompt n'est proposé par ce navigateur lors de ce contrôle. L'absence de l'événement sur le téléphone de l'utilisateur n'est pas démontrée. L'ancien code ne traite ni refus, ni erreur de prompt, ni résultat userChoice ; l'aide n'est pas adaptée à la plateforme et peut être écrasée par les messages de connexion.

## Correctif
Installation déplacée dans install.js, indépendante de l'initialisation et du statut Auth. Événement beforeinstallprompt conservé sans déclenchement automatique ; prompt déclenché au clic uniquement et consommé une seule fois. Refus et erreurs ouvrent une aide persistante. Acceptation ne masque pas prématurément le bouton avant appinstalled ou mode autonome.
Instructions Android Chrome/Edge, iPhone Safari, ordinateur Chrome/Edge/Safari et navigateur intégré. Contrôle natif button, utilisable au clavier. Panneau visible, aria-expanded et fermeture avec retour du focus.
Worker br-manager-v15-7 avec install.js dans le shell. Identités distinctes inchangées : cliente id ./, Manager id /manager/. Scope et start_url Manager /manager/, standalone. Worker racine exclut /manager/ ; worker Manager plus spécifique /manager/. Ne pas désenregistrer le worker cliente pour faciliter l'installation.

## Preuves et limites
120 tests Node réussis : branche native simulée (acceptation, refus, erreur, prompt unique), absence d'événement, aide iPhone/Android/ordinateur, mode déjà installé, identités et scopes séparés. Contrôles syntaxe et catalogue.
Ces simulations ne constituent pas une installation native réelle. Navigateur cloud Chrome disponible pour vérifier le clic et l'aide après déploiement, mais n'offrant pas d'invite native. Aucun appareil Android/iPhone physique contrôlé.

## Adresse
https://belleetrebelle-nailstudio.fr/manager/
Il n'existe pas de lien Web universel qui force une installation. Cette page fournit le manifeste du Manager, sa demande native lorsque disponible, sinon les étapes du navigateur. Ne pas utiliser l'accueil cliente comme point d'installation du Manager.
