# PWA Manager de Mélanie

L’application est incluse dans `site/manager/`. Elle utilise les fonctions Netlify et Supabase de la V15. L’archive Manager séparée est un complément extractible à la racine du projet V15, pas un service de réservation indépendant.

Après validation et mise en ligne HTTPS de la V15, ouvrir :
https://belleetrebelle-nailstudio.fr/manager/

Android/Chrome : menu ⋮ → Installer l’application (ou Ajouter à l’écran d’accueil).
PC/Chrome ou Edge : bouton d’installation de la barre d’adresse ou bouton Installer dans le Manager.

Aucune installation depuis un fichier ZIP ou `file://` : les fonctions serveur et HTTPS sont nécessaires. L’interface est installable ; aucune donnée cliente n’est mise en cache. Hors connexion, seul l’écran de connexion peut s’afficher, les opérations nécessitent Internet.

## Premier accès

1. Dans Supabase Auth, désactiver l’inscription publique. Créer/inviter le compte de Mélanie avec e-mail confirmé, mot de passe personnel, récupération de compte maîtrisée.
2. Copier son UUID Auth dans la table d’autorisation, depuis l’éditeur SQL Supabase (ne jamais utiliser un UUID inventé) :

```sql
insert into public.br15_managers(user_id) values ('UUID_AUTH_VERIFIE');
```

3. Ajouter `SUPABASE_PUBLISHABLE_KEY` dans les variables serveur Netlify, en plus de la clé secrète existante.
4. Se connecter, configurer l’application d’authentification par QR ou clé manuelle, puis saisir le code à six chiffres. Les API Manager exigent un jeton Auth vérifié et le niveau `aal2`.
5. Renseigner horaires, pauses, règles, information clientèle et préférences SMS. Les réservations sont fermées par défaut ; ne les ouvrir qu’après recette.

La session dure au maximum la durée du jeton Supabase (habituellement une heure). Reconnexion et nouveau code après expiration. Les jetons ne sont pas exposés au JavaScript de la page ; cookie HttpOnly, Secure, SameSite Strict.

## Usage

Agenda jour/semaine/mois, ajout d’un rendez-vous, déplacement, annulation, marquage terminé ; catalogue 64 prestations éditable ; fiches clientes avec notes ; export et anonymisation explicite (refusée si RDV futur actif) ; plages horaires/pauses et congés ; notifications en attente, échecs et relance manuelle ; connexion Outlook et choix d’un agenda dédié.

Les plages `datetime-local` pour les congés utilisent le fuseau de l’appareil ; garder le téléphone/PC de Mélanie sur Europe/Paris. Les heures de rendez-vous sont toujours affichées en heure de Paris.

En cas de perte du second facteur : vérifier l’identité de Mélanie, réinitialiser son facteur dans l’administration Supabase Auth et révoquer ses sessions, puis refaire l’enrôlement. Ne pas désactiver le contrôle MFA dans le code. Révoquer l’accès d’un utilisateur en mettant `br15_managers.active=false`.
