begin;
create or replace function public.br15_outlook_blocks(p_blocks jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(151515);
 delete from br15_blocks where source='outlook';
 insert into br15_blocks(starts,ends,label,source,external_id) select (x->>'starts')::timestamptz,(x->>'ends')::timestamptz,'Occupé dans Outlook','outlook',x->>'external_id' from jsonb_array_elements(p_blocks)x;
end $$;
revoke all on function public.br15_outlook_blocks(jsonb) from public,anon,authenticated;
grant execute on function public.br15_outlook_blocks(jsonb) to service_role;
commit;
