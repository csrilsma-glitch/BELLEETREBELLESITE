# WORK — CW3-T05 — PR #14 revue indépendante
23 octobre 2026, 23:07 Europe/Paris. Échéance 23:30. Prolongation et cycle supplémentaire expressément autorisés par le propriétaire. Commit revu e0c6a5b545fa8bf51b265dcee6cdabe13e556d76.

## Verdict : BLOQUÉE — ANO-CW10-001 encore reproductible
209/209 tests Node exécutés et réussis par Work. Chromium 153, viewport 390x844, fichiers réels locaux, fonctions réseau entièrement simulées.
Sur index.html, reservation.html et /app/ : nom minuscule immédiatement exclu, restauration de la conversation ordinaire sans le nom, purge après confirmation simulée puis Merci, expiration déterministe 30 minutes : réussis.
Incident du script reservation : sélecteur checkbox ambigu avec formulaire public, corrigé dans le seul harnais de test et relancé avec succès ; aucun défaut applicatif correspondant.

### Reproduction résiduelle critique
1. Utilisateur : Kit complet uniquement.
2. Réponse simulée du serveur : Quel est votre nom ?
3. Utilisateur : cliente fictive.
4. Réponse simulée : Message fictif reçu : cliente fictive. Nom correctement exclu du stockage.
5. Utilisateur : mardi.
6. Réponse simulée : cliente fictive, voici les horaires disponibles.
7. sessionStorage.getItem('br-melba-session-v1').includes('cliente fictive') === true.
Reproduit dans la vraie iframe /app/ avec assistant.js e0c6a5b. Harnais local /tmp/cw14-repeat-browser.cjs. Les réponses simulées reproduisent une répétition ultérieure possible ; aucune affirmation qu'un modèle réel l'a générée dans ce test.
Cause vérifiée : collecting est remis à false dès qu'une réponse ne contient plus COLLECT. Les private du message initial sont filtrés avant cleanHistory ; le nom minuscule n'est donc plus connu du filtre et la réponse ultérieure est persistée.
Ne pas déployer tant que ce chemin existe. Garder l'état privé pour la phase de réservation après collecte, jusqu'à purge/réinitialisation explicite sûre, ou autre minimisation structurée ; ne pas altérer les signatures. Pas de nouvelle rustine de capitales.

## Intégration
PR #14 non fusionnée, non déployée. Conflit documentaire GitHub dirty également observé ; préserver les archives et versions main au moment de l'intégration, sans réécriture de d8024eb.
Aucune écriture réelle Supabase, réservation, notification ni calendrier. Aucun appareil Android physique testé. Les tests simulés ne valident pas toutes les intégrations réelles.

## Reprise ciblée autorisée si délai raisonnable
Il reste environ 23 minutes à publication : corriger uniquement ce reliquat de la même mission, ajouter sa non-régression, transmettre avant 23h30 avec temps pour revue/déploiement. Sinon suspendre et rendre au propriétaire.
**BALLE À CLAUDE**
