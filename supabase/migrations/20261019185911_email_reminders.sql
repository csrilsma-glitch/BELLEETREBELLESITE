-- Ajoute les rappels e-mail, sans changer les réglages SMS ni les données clientes.
begin;
create or replace function public.br15_enqueue(p_id uuid,p_event text) returns void language plpgsql security definer set search_path=public as $$
declare s br15_settings;r br15_bookings;k text; begin
 select * into s from br15_settings where id;select * into r from br15_bookings where id=p_id;
 update br15_jobs set state='obsolete' where booking_id=p_id and state in ('pending','failed') and kind in ('sms-reminder','email-reminder');
 if s.email_enabled then
 foreach k in array array['email-client','email-manager'] loop
 insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,k,p_id||':'||r.revision||':'||k,jsonb_build_object('event',p_event,'revision',r.revision)) on conflict do nothing;
 end loop;
 if r.status='confirme' and r.starts>now()+interval '24 hours' then
 insert into br15_jobs(booking_id,kind,dedupe,payload,run_at) values(p_id,'email-reminder',p_id||':'||r.revision||':email-reminder',jsonb_build_object('event','rappel','revision',r.revision),r.starts-interval '24 hours') on conflict do nothing;
 end if;end if;
 if s.sms_confirmation then insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,'sms-confirmation',p_id||':'||r.revision||':sms',jsonb_build_object('event',p_event,'revision',r.revision)) on conflict do nothing;end if;
 if s.sms_reminder and r.status='confirme' and r.starts>now()+interval '24 hours' then
 insert into br15_jobs(booking_id,kind,dedupe,payload,run_at) values(p_id,'sms-reminder',p_id||':'||r.revision||':reminder',jsonb_build_object('event','rappel','revision',r.revision),r.starts-interval '24 hours') on conflict do nothing;end if;
 insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,'outlook',p_id||':'||r.revision||':outlook',jsonb_build_object('revision',r.revision)) on conflict do nothing;
 end $$;
revoke all on function public.br15_enqueue(uuid,text) from public, anon, authenticated;
grant execute on function public.br15_enqueue(uuid,text) to service_role;
commit;
