begin;
create or replace function public.br15_erase_client(p_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(151515);
 if exists(select 1 from br15_bookings where client_id=p_id and status='confirme' and ends>now()) then raise exception 'Rendez-vous futur actif : traiter avant anonymisation';end if;
 update br15_jobs set state='obsolete',payload='{}',error=null where booking_id in(select id from br15_bookings where client_id=p_id) and state in('pending','failed','uncertain');
 update br15_bookings set token_expires=now()-interval '1 second' where client_id=p_id;
 update br15_clients set name='Cliente anonymisée',phone='',email='',notes='' where id=p_id;
 return '{"ok":true}';end $$;
revoke all on function public.br15_erase_client(uuid) from public,anon,authenticated;
grant execute on function public.br15_erase_client(uuid) to service_role;
commit;
