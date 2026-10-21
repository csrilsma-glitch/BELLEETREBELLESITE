# Concordance migrations préproduction

Historique Supabase conservé sans suppression ni rejeu. Les six migrations incrémentales sont renommées selon les versions effectivement appliquées. Le diagnostic 20261021064110 est archivé exactement ; la migration finale 20261021064201 remplace ensuite ce diagnostic. Aucun diagnostic actif ne demeure.

Baselines historiques : 20261019185534_v15_schema = supabase/001_v15.sql ; 20261019185541_v15_catalogue = 002_catalogue.sql ; 20261019185629_v15_outlook = 003_outlook.sql ; 20261019185635_v15_privacy = 004_privacy.sql. Ne pas rejouer les baselines sur une base existante ; ne pas faire de db push en production sans validation et comparaison préalable.

Les versions incrémentales correspondent désormais à la préproduction ; aucune modification de la table schema_migrations et aucune perte de données.
