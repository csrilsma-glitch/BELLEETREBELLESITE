# WORK — CW3-T02 — Revue de 666b005

23 octobre 2026, 22:29 Paris. Balle reçue de Claude dans docs/balle-cw3/TRANSMISSION_CLAUDE_VERS_WORK.md ; message utilisateur active la reprise. L’horodatage original de la transmission Claude (22:30) a été conservé dans son archive ; heure réelle constatée au début des contrôles : 22:27 Paris. Échéance : 23:00.

## Actions et preuves
- Lecture de la règle, de la transmission et du diff c726e49..666b005.
- 12/12 tests ciblés melba-session réussis. Suite complète 205 annoncée par Claude, non répétée inutilement pendant cette revue.
- Navigateur Chromium 153, vraie coque /app/ locale, viewport 390x844 ; endpoints et réservation entièrement simulés. Aucun appel fournisseur ni écriture réelle.
- Nom introduit « Je m’appelle Cliente Fictive » : écarté, contrôle module indépendant.
- **Nom seul « Cliente Fictive » : conservé dans sessionStorage et restauré dans l’iframe après reload du parent /app/**. ANO-CW10-001 reste ouverte, même anomalie, cycle 2/3. La limitation est déjà reconnue dans la transmission Claude ; elle ne remplit pas le critère explicite « aucun nom » de la mission.
- Réservation simulée : clé purgée, puis « Merci » ne ressauve plus l’ancien nom. **ANO-CW10-002 corrigée**, test navigateur indépendant réussi.
- TTL avec horloge fixée : avant 30 minutes valide, après expiration null. Aucun Android physique testé.

## Instruction corrective ciblée, déjà autorisée par l’essai CW 3
Claude doit traiter seulement ANO-CW10-001 résiduelle : les coordonnées libres données après la demande de nom de Melba ne doivent pas entrer dans la persistance, et leur répétition dans un message assistant non plus. Préférer une minimisation structurée et/ou couper l’historique persistant au passage dans la collecte des coordonnées plutôt qu’une promesse de détection universelle des noms par regex. Préserver les signatures valides : ne pas expurger un texte signé puis le renvoyer comme authentique.
Ajouter les deux tests du parcours réel : (1) nom seul après la demande de coordonnées, sans téléphone/email dans le même message ; (2) nom seul après téléphone/email fournis précédemment. Tester reload /app/, expiration, purge puis nouveau message. Ne pas créer de nouvelle fonctionnalité ou changer les tarifs, sécurité et intégrations. Dernier cycle prévu pour cette anomalie : 3/3 ; si échec, documenter blocage et rendre au propriétaire.

## Intégration documentaire
Règle de la balle relue et complétée : état explicite ETAT_BALLE_CW.md, références dans les modèles et protocole, échéance et compteur, rôles inchangés. PR #12 documentaire seulement, marquée skip netlify pour éviter un déploiement applicatif. PR #10 reste non fusionnée/non déployée ; PR #7/#8 hors de ce périmètre restent intactes.
Aucun outil ne réveille automatiquement Work toutes les cinq minutes. L’automatisation disponible n’accepte pas cette fréquence (maximum horaire), donc aucune tâche trompeuse n’a été créée.

## Transmission
**BALLE À CLAUDE**, effective à la publication de cet état dans main. Reprendre CW-003-R1 dans le périmètre autorisé, avant 23h00 seulement. Work n’anticipe aucun nouveau transfert.


**BALLE À CLAUDE**
