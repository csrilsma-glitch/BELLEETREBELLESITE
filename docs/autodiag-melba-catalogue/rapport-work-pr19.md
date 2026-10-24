# Revue Work — PR19, 24 octobre 2026

Base production applicative6ad1ec0, mainc7376ac. Rapport Claude lu intégralement, livraisonb4f1d2116feb21adcf2006815f4deb54d32ea715 préservée. Autorisation directe du propriétaire pour corrections, fusion PR19 et production ; aucun nouveau cycleCW ni relais.

## Vérification indépendante et corrections avant publication
- 313tests Claude passent initialement. Deux scénarios supplémentaires reproduisent des défauts : reprise après conseil pendant la collecte interprétant « Je veux réserver » comme prénom ; conseiller utilisant le catalogue statique et consommant deux unités de budget pour un seul appel. Corrigés et couverts par tests.
- La vraie interface marque ses messages de collecte privés : la question de conseil courante est désormais traitée sans rejeter ce marqueur, sans transmettre l'historique de réservation au modèle. Dernière réponse de conseil réutilisable, coordonnées connues et téléphone/e-mail masqués ; identifiant de parcours et expiration du cookie contrôlés. Le contexte et le cookie demeurent inchangés pendant conseil/reprise. Tests avec messages privés et nom effectivement collecté.
- Conseils : catalogue serveur actuel prioritaire, aucun outil, refus d'une confirmation/heure inventée dans la sortie du modèle. Le quota global est réservé une fois avant appel ; limitations IP et protections existantes conservées. Réponses HTTP no-store.
- Multi-sélection textuelle : « Gel sans rallongement + Babyboomer deux doigts » ne conservait que le gel. Séparateurs des vrais noms protégés (Kit complet + prise de mesure, Remplissage3et4, Rallongement popits et demi popits), puis chaque demande résolue. Une première prestation connue survit à la précision de la seconde. Deux choix indéterminés ou prestation inconnue : pas de sélection partielle silencieuse.
- targeted-ui : recherche de créneaux avec la date2030 réussie dans cette reproduction. L'échec atteint ensuite la ligne29 : le test soumettait stop alors qu'Envoyer était volontairement désactivé. La date hors horizon mentionnée par Claude reste une hypothèse historique non reproduite ici. Ajout d'un vrai bouton Arrêter la demande pendant attente, AbortController et identifiant de requête : réponse tardive ignorée, arrêt de conversation sans annuler de rendez-vous. Test clavier/UI utilise cette commande et vérifie le contrôle séquentiel. Aucun contournement d'authentification ni de disponibilité.
- Stop fonctionne aussi en mode conseil, purge cookie/mémoire sans nouvel appel au modèle. Reprise pendant nom/prénom/e-mail/téléphone n'ingère jamais la commande de mode comme champ cliente.

## Contrôles réellement exécutés
- **322/322 Node**,0échec :224Work+89Claude+9régressions Work.
- Correspondance arbre du crâne/catalogueJSON :64feuilles. Comparaison à l'API publique de production avant fusion :64/64 mêmes IDs, chemins, noms, minutes et centimes. Aucune écriture ni modification de tarif.
- Couverture64prestations « famille+nom » par gestionnaire HTTP : ID correct, date seule, aucun appel modèle. 17familles avec précision et choix successif ;28libellés uniques et36partagés à préciser, aucun choix arbitraire. « Baby boomer » désigne4variantes de prix/durées différents : précision2/4/6doigts/mains, puis date ; une demande déjà précise passe directement à la date.
- SQL PGlite : toutes migrations/assertions passent (prix/durées, concurrence, idempotence, annulation/déplacement, indisponibilités et RLS). Aucun Supabase réel modifié.
- Rappels :24h, déplacement, obsolescence, annulation répétée et reprise crash : OK.
- Chromium153 : suite générale PC/tablette/mobile/paysage, crâne, sélection, Manager et PWA. Lecture initiale des12MP4 originaux réussie, sans WebM ; pas de visionnage intégral ni appareil physique.
- targeted-ui :390/820/1440px,96créneaux en select, clavier, invalidation date, réponse tardive aprèsstop et déplacement Manager compact : OK.
- melba-sequential-browser : vrais gestionnairesHTTP et migrations SQL locales sur accueil1440x1000, réservation820x1180, PWA/app390x844 ; passage conseil après nom, reprise au prénom, rechargement, récapitulatif, clic et insertion SQL locale, purge,6types de jobs livrés en simulation, annulation.3réservations jetables ; zéro fournisseur réel. Dimanche fermé/pause13h–14h vérifiés.
- Suites Manager UI, MFA UI (politiques existantes préservées), récupération9parcours : OK. scripts/check et diff --check : OK.

## Publication / limites
Référence de retour arrière créée avant fusion ; SHA fusionné, Netlify et contrôles HTTPS consignés dans la PR19 et la clôture Work après déploiement. Les rapports antérieurs sont conservés comme historique.
Aucune donnée cliente, aucun secret, compte, MFA ou paramètre fournisseur modifié. Aucun rendez-vous réel, e-mail/SMS ou événement Outlook de test. La réservation complète et ses jobs sont validés en simulation/base isolée, jamais présentés comme une nouvelle réception réelle. Pas d'Android/iPhone physique. Les contrôles publics s'arrêtent avant Confirmer.
