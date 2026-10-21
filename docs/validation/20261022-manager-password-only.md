# Manager : suspension temporaire de l'exigence MFA — 22 octobre 2026

Décision explicite du propriétaire : connexion par e-mail et mot de passe pour les deux comptes Manager existants uniquement. L'exception utilise leurs identifiants Auth immuables, jamais un paramètre client ou des métadonnées modifiables. Tout accès reste vérifié par Supabase Auth puis la liste des Managers actifs.

Les comptes, mots de passe, facteurs existants, droits et données ne sont pas modifiés. Les contrôles des autres comptes restent inchangés. L'application ne demande plus de facteur après le login de ces deux comptes et autorise leur session AAL1 côté serveur. HTTPS, cookie HttpOnly/Secure/SameSite=Strict, limitation des tentatives et contrôle des rôles conservés.

Manager SW : br-manager-v15-9, pour charger le nouveau parcours sans réinstallation. Les deux PWA restent dans le même projet Netlify, avec leurs scopes existants.

Vérifications : 148 tests Node réussis ; syntaxe 37 JS et 64 prestations ; tests navigateur des deux parcours sans demande de facteur, plus parcours MFA conservés pour les autres comptes ; tests Manager sur cinq configurations réussis. API et identifiants fictifs utilisés en navigateur. Les identités et droits actifs des deux comptes réels ont été vérifiés en lecture seule en production. Aucun mot de passe personnel n'est disponible pour démontrer une connexion personnelle de bout en bout.

La récupération du mot de passe et les facteurs enregistrés ne sont pas modifiés par cette suspension du contrôle d'accès au Manager. Aucun e-mail ou SMS de test envoyé. Google n'est pas activé : évolution ultérieure à configurer avec OAuth et liaison contrôlée aux comptes existants ; ne pas créer de doublons ni autoriser automatiquement toute adresse Google.

Retour à une MFA obligatoire : retirer l'exception des deux identifiants dans core.js après résolution et validation personnelles du nouveau parcours, puis déployer. Aucun facteur n'a été supprimé pour réaliser la suspension.
