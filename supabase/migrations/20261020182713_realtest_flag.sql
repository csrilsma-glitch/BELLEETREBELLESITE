-- Essais réels de notifications (préproduction) : marquage explicite d'une réservation.
-- Colonne vide par défaut : aucune réservation n'envoie de vrai e-mail ou SMS tant que l'opérateur ne la marque pas.
alter table public.br15_bookings add column if not exists real_test_until timestamptz;
comment on column public.br15_bookings.real_test_until is 'Préproduction uniquement : envois réels e-mail/SMS de confirmation jusqu''à cet instant. Null = simulé.';
