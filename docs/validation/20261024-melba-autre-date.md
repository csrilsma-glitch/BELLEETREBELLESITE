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

## Clôture vérifiée — 24octobre2026, Europe/Paris
- PR20 fusionnée ; code testé dfacd3c2b42d4f374279a6111b358dcdcd4127f1.
- **SHA réellement publié : b4ee16cb21dc7499497de59f21b423806446b812**.
- Netlify production belleetrebelle-nailstudio, déploiement6adc0df1ec183b0f27999cf5, ready, publié le24octobre2026 à03:46:41Paris (01:46:41UTC), error_message:null.
- Retour arrière préparé avant fusion : backup/main-pre-melba-autre-date-20261024 →ffa36c72efabc0de965972f75b16f3a07d6c2dbd ; procédure revert ciblé puis redéploiement.
- Production HTTPS, sur accueil, reservation.html ET /app/ : Babyboomer deux doigts7€/10min →26octobre →seul après-midi →Non le Matin →propose autre jour le matin sans reproposer après-midi →Oui →dates moteur27/28/29octobre2026. Sur accueil, clic27octobre revérifie et affiche10:00/10:40/11:15/11:55. Aucun clic de confirmation.
- 332tests Node,10régressions nouvelles, navigateur ciblé3formats et parcours HTTP/SQL complet isolé réussis. Pas d’Android/iPhone physique. Aucune réservation/message/écriture calendrier réel. Les tests complets de création et intégrations sont simulés/isolés uniquement.
- Un seul déploiement applicatif. Clôture documentaire marquée skip netlify, ne change pas la version applicative publiée.
- Statut **TERMINÉE**. Aucun nouveau chantier ni action attendue de Claude. Proposition éventuelle de contrôle physique Android : EN_ATTENTE_VALIDATION, sans obligation de répéter les tests automatisés.
