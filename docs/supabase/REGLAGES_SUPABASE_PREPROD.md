# Réglages Supabase — récupération du mot de passe Manager (préproduction)

Projet de test : `xrpjrweqdhihloykabml`. Ne jamais appliquer ces réglages au projet de production.

## 1. Authentication → URL Configuration
- **Site URL** : `https://belleetrebelle-v15-preproduction.netlify.app/manager/reset-password.html`
  (en cas de repli de Supabase, le lien aboutit directement sur la page de réinitialisation).
- **Redirect URLs** (ajouter) :
  `https://belleetrebelle-v15-preproduction.netlify.app/manager/reset-password.html`
- Ne pas ajouter le domaine de production sur ce projet.

## 2. Authentication → Email Templates → Reset password
- Objet : `Réinitialisez votre accès Manager ♡`
- Corps : contenu de `recuperation-manager-email-fr.html` (conserver `{{ .ConfirmationURL }}`).

## 3. Netlify, site de préproduction (variables d'environnement)
- `SITE_URL` = `https://belleetrebelle-v15-preproduction.netlify.app`
- `PREPROD_RECOVERY_TEST` = `true` **uniquement pendant un test**, puis `false`.
- `PREPROD_RECOVERY_ALLOWLIST` = votre adresse Manager de test (une seule adresse).

## 4. Accès au site de préproduction
- Le site est actuellement protégé par la connexion d'équipe Netlify pour tous les visiteurs.
  Une personne hors de l'équipe (dont Mélanie) ne peut donc pas ouvrir le lien de récupération.
- Pour un test avec Mélanie, il faut décider : soit lever la protection pour la préproduction,
  soit l'inviter dans l'équipe Netlify. Ce choix est le vôtre.

## 5. Limites Supabase à connaître
- Un lien de récupération n'est valable qu'une fois et expire au bout d'un délai fixé par Supabase.
- Supabase limite le nombre d'e-mails envoyés par adresse ; ne pas enchaîner les tests.
