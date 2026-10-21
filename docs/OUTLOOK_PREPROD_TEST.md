# Outlook en préproduction — test avec un compte Microsoft de test uniquement

## Comportement du code
- Par défaut (drapeau absent, `false` ou toute autre valeur que `true`) : aucun accès Outlook en préproduction.
  Connexion, retour OAuth, Graph, calendriers, synchronisation et écriture renvoient 503.
- `OUTLOOK_PREPROD_TEST=true` ouvre **uniquement** le parcours de connexion : demande d'autorisation, retour OAuth et échange du code.
- Le retour OAuth n'accepte le jeton que si l'identifiant du compte (`preferred_username` de l'id_token)
  est égal à `OUTLOOK_PREPROD_TEST_ACCOUNT`. Sinon : refus 403 et rien n'est stocké.
- Le jeton est chiffré (AES-256-GCM) et stocké dans `br15_outlook` de la base Supabase de préproduction uniquement
  (l'isolation refuse toute autre base).
- Jamais de création, modification ou suppression d'événement : l'envoi Outlook de la file reste simulé.
- La synchronisation automatique reste désactivée en préproduction.
- Production : comportement inchangé (scope `offline_access Calendars.ReadWrite`, aucun drapeau).

## Ce que le consentement autorise (compte de test uniquement)
- Lecture et modification de tous les calendriers du compte de test.
- Jeton de renouvellement stocké en préproduction, valable jusqu'à révocation.
- Révocation : https://account.live.com/consent/Manage (à faire après chaque test).

## Réglages manuels (à valider avant tout consentement)
1. Microsoft Entra (inscription d'application) :
   - types de comptes : comptes Microsoft personnels ;
   - plateforme Web, URI de redirection exactement :
     `https://belleetrebelle-v15-preproduction.netlify.app/.netlify/functions/outlook-callback` ;
   - permissions déléguées : `Calendars.ReadWrite`, `offline_access`, `openid` ; secret client valide, date d'expiration notée.
2. Compte Microsoft de TEST, créé pour cette occasion, avec un calendrier « Test Belle Rebelle ». Jamais le compte de Mélanie.
3. Netlify, préproduction, variables :
   - `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` (URI ci-dessus) ;
   - `OUTLOOK_PREPROD_TEST_ACCOUNT` = adresse du compte de test ;
   - `OUTLOOK_PREPROD_TEST` = `true` pendant le test seulement, puis retirer ou mettre à `false`.
4. Après le test : révoquer l'accès (point ci-dessus) et supprimer la connexion depuis le Manager préproduction
   (« Déconnecter », qui n'appelle pas Microsoft).

## Limite connue
Si le consentement est donné avec un autre compte, Microsoft conserve l'autorisation côté compte : il faut la révoquer
depuis ce compte. Le code n'a jamais gardé ce jeton.
