# Transmission à Work — parcours de réservation Melba

**Branche à déployer :** `fix/20261023-melba-parcours`, commit `3ba662f` (au-dessus de `c0c20e0`, version actuellement déployée).
**Ne pas fusionner avant autorisation. Work déploie après l'accord de Mélanie.**

## Ce qui est corrigé
- HTN-ERR-076 : « Le 27 octobre à 10h40 » retient le créneau (avant : liste répétée).
- HTN-ERR-077 : les coordonnées mènent à un récapitulatif et à une proposition à confirmer par clic (avant : « je dois vérifier le calendrier »).
- Dates au format « 27/10 » ; coordonnées en libellés ou en plusieurs messages ; « je confirme » dans le chat renvoie vers le bouton Confirmer.
- Cache PWA renouvelé : `br-v15-20261023-parcours`.

## Ce qui ne change pas
Apparence, personnalité et prompt de Melba ; PWA ; Manager ; menus déroulants ; prestations et prix ; règles de pause et d'alternative ; confirmation réelle côté serveur.

## Tests (commit 3ba662f)
- `node --test tests/*.test.js` : 192/192.
- `tests/melba-parcours.test.js` : parcours complet par le gestionnaire HTTP, calendrier et modèle simulés. Échoue sur `c0c20e0`, réussit sur `3ba662f`.
- `tests/melba-confirmation.test.js` : confirmation isolée (base simulée). Créneau pris, absence de confirmation, création unique.
- SQL, rappels, contrôles de fichiers : OK.
- Navigateur (site, targeted-ui, Manager, MFA, récupération) : OK, Chromium préinstallé.

## Limites
- Le modèle est simulé dans les tests. Le comportement réel de Claude sur les formulations libres doit être vérifié sur téléphone.
- Aucun test sur appareil physique ni en production dans cette session (accès bloqué par le proxy).

## Vérifications à faire après déploiement (Android, PWA installée, après actualisation)
1. « Bonjour, je voudrais prendre rendez-vous pour un kit press nails complet uniquement. » → prestation retenue, date demandée.
2. « Le 26 octobre au matin. » → indisponibilité, proposition du 27.
3. « Le 27 octobre à 10h40. » → 10h40 retenu, liste non répétée.
4. Nom, téléphone, e-mail → récapitulatif : Kit complet uniquement, 25 €, 30 min, mardi 27 octobre 2026 à 10:40, bouton Confirmer.
5. « Puis-je consulter le récapitulatif ? » → même récapitulatif.
6. Ne confirmer qu'avec le bouton : vérifier qu'un seul rendez-vous est créé et qu'un e-mail/SMS réel n'est envoyé qu'en production.

## Mission de déploiement proposée à Work
Déployer `3ba662f` sur Netlify après autorisation ; exécuter les six vérifications ci-dessus ; consigner le résultat dans le rapport partagé avec le commit déployé.
