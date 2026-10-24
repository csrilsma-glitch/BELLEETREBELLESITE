# MELBA-PERIOD-001 — refus d’une période indisponible

Mission directe Work autorisée par le propriétaire le 24 octobre2026 : correction, tests, fusion et un déploiement production. Référence de départ : ffa36c72efabc0de965972f75b16f3a07d6c2dbd. Branche fix/20261024-melba-autre-date. Aucun relais Claude ou cycleCW.

## Symptôme et cause vérifiée
Android propriétaire : 26octobre2026, Babyboomer deux doigts7€/10min, seul après-midi disponible. « Non le Matin » redemande l’après-midi refusé. Reproduit également en navigateur cloud sur la production avant modification.
Le moteur déterministe supprimait state.preference lorsque le filtrage ne renvoyait aucun créneau, puis reproposait la seule période restante. Ce n’est pas un défaut à corriger dans le promptIA.

## Correction
- État signé alternative distinct : conserve prestations et préférence, reconnaît le refus et demande l’accord pour chercher un autre jour. Ne repropose jamais immédiatement la période refusée. Un simple non après proposition unique est pris en compte.
- Aucune recherche multi-date sans accord. À l’accord, appelle booking.availability pour chacune des prochaines dates, avec les mêmes IDs et donc la durée cumulée actuelle, les règles SQL, horaires, pauses et protection Outlook existants.
- Jusqu’à3dates disponibles, recherche bornée aux14jours suivants pour limiter les appels. Si aucune date n’est trouvée, l’étendue est annoncée honnêtement ; la cliente peut indiquer une autre date. Ce n’est pas une assertion d’absence globale de disponibilités.
- Choix d’une date (bouton ou texte) : consultation fraîche du moteur, conserve la période, propose les horaires réels, puis nom. Une date devenue occupée ne reste pas présentée comme libre.
- Insistance : garde la préférence, ne renvoie pas à l’autre période ; refus de recherche : demande d’une autre date. Panne calendrier :503sans inventer de disponibilité ni résultat partiel, contexte validé conservé pour réessayer.
- Contexte de recherche restaurable30min sans coordonnées. Cookie protégé, purge, confirmation explicite, sécurité et files fournisseurs inchangés. Aucun changement client ou serviceworker requis : correction exclusivement serveur.

## Tests exécutés
- 10nouveaux tests HTTP : symétrie matin/après-midi, aucune période, accord, refus et insistance, conservation multi-prestations/préférence, recherche bornée, panne et revalidation d’une date devenue occupée, question paiement en attente. Huit scénarios échouaient avant correction.
- Suite Node332/332,0échec. Le test antérieur journée bloquée est actualisé : l’étape attendue devient alternative, avec boutons de consentement, sans faux créneau.
- npm run test:melba-alternatives : Chromium, accueil1440x1000, réservation820x1180, PWA/app390x844 ; cas exact Non le Matin, refus répété, rechargement, Oui, clic sur date du moteur, choix10h40, nom puis stop. Multi-prestations59€/100min conservées. Calendrier fictif ; HTTP réel ; écritures/fournisseurs interdits.
- npm run test:melba-flow : vrais gestionnaires HTTP et SQL PGlite jetable,3parcours complets avec clic final local, purge privée,6types de jobs simulés et annulation ; dimanche fermé/pause13h–14h. Aucun accès fournisseur réel.
- npm run check :40JSvalides,64prestations conservées ; git diff --check réussi.

## Publication et limites
Le SHA de fusion, le déploiement ready et les résultats après publication seront consignés dans la clôture GitHub. Référence de retour arrière avant fusion ; si incident, revert ciblé et redéploiement, sans modifier les données.
Aucun rendez-vous réel, e-mail/SMS ou événement Outlook créé. Aucun tarif, secret, compte Manager, règleMFA, donnée cliente ou média modifié. Pas d’Android/iPhone physique : ces trois formats sont testés dans Chromium. Les preuves SQL/fournisseurs simulés ne constituent pas une nouvelle réception réelle. Réserves historiques inchangées.

## Prévention AutoDiag
Régression détectable par npm test et npm run test:melba-alternatives. Critère métier : une préférence refusée sur une date doit rester dans l’état signé ; ne pas la remplacer par une période alternative sans choix explicite. Toute proposition de date doit avoir une lecture calendrier préalable et être revalidée lors du choix.
