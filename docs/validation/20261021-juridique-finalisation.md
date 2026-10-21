# Belle & Rebelle V15 — finalisation juridique en préproduction

Date : 21 octobre 2026. Base de travail : 54ea856c65e6a00b12b0b298d20476d793e49dec, branche dev/v15-recovery-20261020.

## Décisions reçues et appliquées

Identité validée : Mélanie RIPALDI (BONNEVILLE), entreprise individuelle ; Belle & Rebelle ; SIRET 882 544 307 00011 ; adresse 28 rue de Messei, 61100 Flers ; téléphone 06 62 28 75 45 ; activité onglerie. Publication de l'adresse autorisée. Contact utilisé : belleetrebelle.flers@outlook.com.

TVA : déclaration de franchise en base de l'exploitante, NON vérifiée fiscalement. Mention article 293 B du CGI conservée avec réserve documentaire explicite. Aucun seuil fiscal déduit du chiffre d'affaires indiqué oralement.

Médiation : décision de poursuivre la préparation prise par l'utilisateur en connaissance du risque. Aucun médiateur, assureur ou organisme n'est présenté comme désigné. Rubrique #mediation facilement modifiable dans les mentions et conditions. **Obligation de médiation et information des coordonnées non régularisées : non-conformité restante**, sans délai de grâce affirmé. L'assurance professionnelle doit confirmer une adhésion couvrant les litiges clients de cette activité ; le médiateur de litiges bancaires ne remplace pas automatiquement celui de l'activité d'onglerie. MCP Médiation n'est pas mentionné comme adhésion acquise.

## Périmètre modifié

Quatre pages : site/mentions-legales.html, site/confidentialite.html, site/conditions-reservation.html, site/cookies.html ; feuille site/legal.css. Identité complète et contact, TVA conditionnelle, réserve médiation, paiements sur place, absence d'acompte et de pénalités automatiques, règle 24 h distinguée des droits légaux, description réelle des fournisseurs et stockages. Pages noindex et notice de validation préproduction maintenues.

Aucun JavaScript, fonction serveur, migration, secret, donnée, média ou service de production modifié. Les liens de pied de page et du formulaire vers ces pages existent déjà et sont conservés. Pas de nouvelle purge, de recueil de renonciation ou de traceur introduit. Pas d'e-mail, SMS ou événement Outlook déclenché par ce lot.

## Vérifications indépendantes et sources

- API officielle de recherche d'entreprises interrogée le 21/10/2026 : SIREN 882544307, nom complet MELANIE RIPALDI (BONNEVILLE) (BELLE & REBELLE), nature juridique 1000, état A, entrepreneur individuel true. https://recherche-entreprises.api.gouv.fr/search?q=882544307
- Mentions professionnelles, identité EI, coordonnées, hébergeur (nom/adresse/téléphone) : https://entreprendre.service-public.gouv.fr/vosdroits/F37351 (page vérifiée le 13/10/2026). Aucune immatriculation à un greffe inventée.
- Netlify : nom et adresse confirmés dans https://www.netlify.com/privacy/ et https://www.netlify.com/legal/terms-of-use/ ; contact support confirmé par https://www.netlify.com/legal/self-serve-subscription-agreement/. Téléphone non retrouvé dans les sources officielles consultées : à obtenir, pas de numéro d'annuaire tiers ajouté comme vérifié.
- TVA : https://bofip.impots.gouv.fr/bofip/1079-PGP.html/identifiant=BOI-TVA-DECLA-40-10-20-20260701 ; la règle générale ne prouve pas le régime personnel de Mélanie.
- Médiation : https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/vos-principales-obligations-0 et liste officielle https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/choisir-un-mediateur-de-la-consommation/mediateurs-references.
- Conservation : https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees. Le délai de 3 ans parfois cité pour la prospection ne devient PAS automatiquement la durée de tout le fichier clientes ; aucune prospection n'est ajoutée.
- Droits : https://www.cnil.fr/fr/repondre-une-demande-de-droit-dacces. Réponse en principe un mois, prolongations sous conditions.
- Rétractation : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/delais-de-reflexion-ou-de-retractation-comment-sappliquent-t-ils. Pas d'exemption « loisirs » supposée pour les prestations d'onglerie.
- Traceurs : https://entreprendre.service-public.gouv.fr/vosdroits/F31228 (page désormais consacrée aux cookies, mise à jour le 13/10/2026), https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi.
- Transferts Supabase : https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq ; sauvegardes et plans : https://supabase.com/docs/guides/platform/backups. Aucun plan, garantie ou région de production modifié pour cet audit.
- Conservation API Anthropic : https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data ; politique standard de 30 jours avec exceptions/dispositions contractuelles, pas de ZDR présumée.

## Audit technique ciblé

Code de référence lu : core.js (cookie sécurisé, durée par défaut), manager-forgot.js (récupération simulée en préproduction), manager-recovery.js (cookie 600 s), notifications.js (simulation préproduction), sw.js (cache statique, exclusion Manager/API/médias), selecteur.js/script.js (sessionStorage). Outlook-connect.js : état OAuth en base expirant au bout de 600 s ; ne pas inventer un cookie OAuth absent de ce parcours. Description des prestataires : Supabase, Netlify, Microsoft, Resend, Brevo, Anthropic ; Google Fonts pour les polices distantes. Liens sociaux et ajout Google Agenda facultatifs ne sont pas décrits comme une synchronisation Google.

Aucun outil publicitaire ou de mesure d'audience soumis au consentement identifié dans le code ciblé. Pas de bandeau ajouté sans justification. L'injection de badge Netlify observée auparavant et les réglages réels doivent rester dans le contrôle final de traceurs ; absence de traceur dans le dépôt ne certifie pas l'absence de tout traitement chez l'hébergeur.

## Informations et décisions encore indispensables

1. Confirmation documentaire du régime TVA. L'affirmation actuelle est clairement attribuée à l'exploitante.
2. Médiateur effectivement compétent : identité, adresse, site et preuve d'adhésion/couverture. Non-conformité assumée pour la préparation, non effacée par ce rapport.
3. Durée du fichier clientes/notes/historique : durée chiffrée, point de départ, procédure de revue/effacement, archivage justifié. Le paramètre 365 jours ne lance aucune purge. Pas de durée fictive pour journaux, sauvegardes ou messages des fournisseurs.
4. Qualification de l'engagement à distance, droit de rétractation et procédure applicable aux prestations effectuées dans les 14 jours ; formulaire et consentements anticipés ne sont pas créés fictivement dans une page. Il faut valider la règle puis adapter si nécessaire le parcours sans renonciation présumée.
5. Documentation des contrats de sous-traitance/transferts et réglages de rétention réellement appliqués aux comptes. Les pages n'affirment pas que tout reste dans l'UE.
6. Compléments techniques : téléphone officiel de l'hébergeur à obtenir ; libellé/inscription au registre compétent à confirmer sur justificatif officiel si nécessaire.

Ne pas redemander l'adresse, le téléphone ou l'identité déjà autorisés. Aucun nouvel audit général, aucune répétition de tests réservation/Outlook déjà réussis : changement exclusivement éditorial et CSS.

## Validation technique de ce lot

Contrôle local des quatre pages : analyse HTML, unicité des identifiants, un titre principal, viewport présent, navigation entre les pages, contacts, absence de script exécutable ajouté et de médiateur inventé. Contrôle de contenu identité/TVA conditionnelle réussi. CSS adaptative avec retour à la ligne, taille fluide et tables à défilement local.

Les 106 tests Node précédents ne sont pas revendiqués comme relancés pour ce lot éditorial. Les tests fonctionnels déjà validés restent des preuves datées de leur version. Une vérification HTTP et navigateur du déploiement est effectuée après publication en préproduction ; aucun test physique Android/iPhone n'est prétendu.

## Conclusion de préparation

Pages complétées avec les données autorisées et réserves explicites. **Ne pas annoncer « conformité complète » ou « prête au lancement »** tant que les réserves réellement applicables ci-dessus et l'accès personnel Manager ne sont pas résolus. La décision sur la médiation ne vaut pas autorisation de production ni validation des autres inconnues.

## Preuves après déploiement

Premier commit : a1d51819288125b93f90b08e1d10b65742e33eb1. Déploiement Netlify 6ad8fee1400299f55e05c580, ready, publié 2026-10-21T18:05:35.924Z (20h05 Paris). Comparaison GitHub : exactement six fichiers du lot juridique ; aucun changement fonctionnel.

HTTP 200 et contenu à jour pour les quatre pages et legal.css. Aucun en-tête Set-Cookie dans ces réponses. Navigation vérifiée dans le navigateur cloud entre mentions, confidentialité, conditions et cookies, sans connexion. Pas de débordement horizontal constaté sur mentions/confidentialité/conditions au viewport de bureau 1363 px. Une navigation enchaînée trop rapidement vers Cookies n'a pas abouti au premier essai ; le lien a ensuite été cliqué et la bonne page confirmée. Pas de test Android physique prétendu.

Le DOM réel montre le script /.netlify/scripts/hud?variant=public et l'iframe srcdoc nl-badge-frame. Le script téléchargé (35 727 caractères à la date du contrôle) comporte trois références à localStorage : préférence nl-hud:public:v1, valeurs mini/hidden/hidden:<timestamp>, masquage public sept jours. Aucun document.cookie, sendBeacon, fetch, gtag ou Google Analytics trouvé dans ce script par le contrôle ciblé ; cela ne prouve pas l'absence de tout traitement chez Netlify. La politique cookies est complétée par cet inventaire. Aucun bandeau ajouté par supposition.
