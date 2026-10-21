-- Préproduction : réponses JSON construites sans littéraux échappés.
-- Fonction existante conservée avec ses droits et opérations.
create or replace function public.br15_admin(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin
 perform pg_advisory_xact_lock(151515);
 if p_action='settings' then
 if (p_data->>'enabled')::boolean and (not exists(select 1 from br15_hours) or coalesce(p_data->>'privacy_text','')='') then raise exception 'Horaires et information clientèle requis';end if;
 update br15_settings set enabled=coalesce((p_data->>'enabled')::boolean,enabled),lead_minutes=coalesce((p_data->>'lead_minutes')::int,lead_minutes),horizon_days=coalesce((p_data->>'horizon_days')::int,horizon_days),buffer_minutes=coalesce((p_data->>'buffer_minutes')::int,buffer_minutes),cancel_hours=coalesce((p_data->>'cancel_hours')::int,cancel_hours),sms_confirmation=coalesce((p_data->>'sms_confirmation')::boolean,sms_confirmation),sms_reminder=coalesce((p_data->>'sms_reminder')::boolean,sms_reminder),email_enabled=coalesce((p_data->>'email_enabled')::boolean,email_enabled),outlook_required=coalesce((p_data->>'outlook_required')::boolean,outlook_required),privacy_text=coalesce(p_data->>'privacy_text',privacy_text),retention_days=coalesce((p_data->>'retention_days')::int,retention_days),compatibility=coalesce(p_data->'compatibility',compatibility) where id returning to_jsonb(br15_settings.*) into result;
 elsif p_action='service' then update br15_services set name=p_data->>'name',path=p_data->>'path',minutes=(p_data->>'minutes')::int,cents=(p_data->>'cents')::int,position=(p_data->>'position')::int,active=(p_data->>'active')::boolean where id=p_data->>'id' returning to_jsonb(br15_services.*) into result;
 elsif p_action='hours' then
 delete from br15_hours;
 insert into br15_hours(dow,opens,closes) select (x->>'dow')::int,(x->>'opens')::time,(x->>'closes')::time from jsonb_array_elements(p_data->'hours')x;
 result:=jsonb_build_object('ok',true);
 elsif p_action='block' then
 if exists(select 1 from br15_bookings where status<>'annule' and tstzrange(starts,busy_until,'[)') && tstzrange((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,'[)')) then raise exception 'Un rendez-vous occupe cette période';end if;
 insert into br15_blocks(starts,ends,label) values((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,left(p_data->>'label',200)) returning to_jsonb(br15_blocks.*) into result;
 elsif p_action='unblock' then delete from br15_blocks where id=(p_data->>'id')::uuid and source='manager';result:=jsonb_build_object('ok',true);
 elsif p_action='client' then update br15_clients set notes=left(p_data->>'notes',4000) where id=(p_data->>'id')::uuid;result:=jsonb_build_object('ok',true);
 else raise exception 'Action inconnue';end if;return result;end $$;
