# Pauses Manager et Outlook — vérification du 21 octobre 2026

Le comportement actuel est asymétrique et explicite dans le code : les rendez-vous natifs sont exportables vers Outlook via br15_enqueue et outlook.push ; les événements occupés Outlook sont importables dans br15_blocks. Une pause Manager est insérée avec source manager par br15_admin(block), sans tâche Outlook ni mapping d’événement. Attendre le cron ne crée donc aucun événement pour cette pause. Aucun correctif applicatif nécessaire pour ce comportement existant ; aucun export de pauses ajouté.

Lecture seule sur xrpjrweqdhihloykabml : pause TEST V15 — Pause fictive retrouvée le 29 octobre 2026 de 13 h à 14 h Europe/Paris, source manager. br15_slots pour gel-gainage, deco-simple-unite, fc-2 : zéro créneau chevauchant cette période.

Tests SQL locaux exécutés avec succès : création d’une pause, refus d’une réservation forcée sur cette pause, refus du déplacement d’un rendez-vous vers cette pause, absence de chevauchement pour plusieurs prestations, conservation des pauses Manager après import Outlook vide. Tous les tests SQL passent. Les 14 tests Outlook simulés ciblés passent également ; aucun appel Microsoft réel.

Les pauses, réservations et modifications Manager utilisent le même verrou transactionnel. br15_book et br15_change recontrôlent br15_slots. Le retrait d’une pause et le blocage des horaires sont déjà couverts par la suite SQL. L’import Outlook ne supprime que les blocs source outlook ; les blocs manager restent conservés.

Limite à communiquer : une pause Manager ne devient pas visible dans Outlook. Le site et Melba la respectent immédiatement ; Outlook ne peut pas en tenir compte pour une saisie effectuée directement dans son interface. Ne pas assimiler ce comportement à une synchronisation bidirectionnelle des pauses.

Production et Outlook inchangés. Aucune donnée distante modifiée, aucun SMS ni e-mail envoyé. Aucun test manuel supplémentaire nécessaire pour ce point. Tests et documentation seulement : aucun déploiement requis.
