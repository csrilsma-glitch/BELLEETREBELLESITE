# Essai réel Outlook autorisé — 21 octobre 2026

Préproduction uniquement. Compte vérifié par connecteur : belleetrebelle.flers@outlook.com. Calendrier non principal « Belle & Rebelle — Réservations », identique au calendar_id enregistré dans Supabase TEST.

Déploiement applicatif : 95b843013d915cb82dea7a8d49aeb535df76ed8b, Netlify 6ad883b80de5182bc1712fc2, ready 09:20:14 UTC.

Isolation supplémentaire : OUTLOOK_PREPROD_BLOCK_ID = ba49b590-3130-4396-b7c8-0c5e8043f5ea. Seul ce bloc peut être exporté ; les autres pauses restent différées. Les jobs de rendez-vous Outlook restent simulés tant que cet identifiant est défini. Les e-mails/SMS sont toujours simulés en préproduction.

Pause fictive créée dans la table du Manager (par SQL de test, sans session UI Manager), puis modifications/suppression prévues via les RPC utilisées par le Manager. Libellé : TEST V15 — cycle automatique 21 octobre. Créneau initial : 10 novembre 2026, 11h–12h Europe/Paris (10h–11h UTC). Aucun rendez-vous Supabase ni événement Outlook préexistant dans la fenêtre de test 10h–13h UTC.

L'insertion a généré le job outlook-block, revision 1. Contrôle br15_slots avec prestation fc-2 : aucun créneau chevauchant la pause. Le planificateur de production du projet de TEST (*/5 minutes) est utilisé, sans endpoint de contournement ni affaiblissement Auth.

106 tests Node réussis dont garde d'identifiant unique. Test réel encore en cours ; ne pas lire ce checkpoint comme preuve d'export réussi.
