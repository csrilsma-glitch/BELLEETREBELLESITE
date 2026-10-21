begin;
create extension if not exists btree_gist;
-- Namespace séparé : aucune hypothèse destructive sur les 7 tables existantes.
create table if not exists public.br15_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 timezone text not null default 'Europe/Paris' check(timezone='Europe/Paris'),
 lead_minutes int not null default 120 check(lead_minutes>=0), horizon_days int not null default 90 check(horizon_days between 1 and 365),
 buffer_minutes int not null default 0 check(buffer_minutes between 0 and 120),
 cancel_hours int not null default 24 check(cancel_hours>=0),
 sms_confirmation boolean not null default false,sms_reminder boolean not null default false,
 email_enabled boolean not null default true, outlook_required boolean not null default false,
 compatibility jsonb not null default '[]' check(jsonb_typeof(compatibility)='array'),
 privacy_text text not null default '', retention_days int not null default 365 check(retention_days>=30));
insert into public.br15_settings(id) values(true) on conflict do nothing;
create table if not exists public.br15_managers(user_id uuid primary key references auth.users(id),active boolean not null default true);
create table if not exists public.br15_services(id text primary key,name text not null,path text not null,minutes int not null check(minutes between 1 and 480),cents int not null check(cents>=0),position int not null,active boolean not null default true);
create table if not exists public.br15_hours(id uuid primary key default gen_random_uuid(),dow int not null check(dow between 0 and 6),opens time not null,closes time not null,check(closes>opens));
create table if not exists public.br15_blocks(id uuid primary key default gen_random_uuid(),starts timestamptz not null,ends timestamptz not null,label text not null default '',source text not null default 'manager',external_id text unique,check(ends>starts));
create table if not exists public.br15_clients(id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text not null,notes text not null default '',created_at timestamptz not null default now());
create table if not exists public.br15_bookings(
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique, client_id uuid not null references public.br15_clients,
 starts timestamptz not null, ends timestamptz not null,busy_until timestamptz not null,
 status text not null default 'confirme' check(status in ('confirme','annule','termine')),
 cents int not null,minutes int not null,services jsonb not null,
 token_hash text not null,token_expires timestamptz not null,
 revision int not null default 1,created_at timestamptz not null default now(),
 check(ends>starts),check(busy_until>=ends),
 exclude using gist(tstzrange(starts,busy_until,'[)') with &&) where (status<>'annule'));
create table if not exists public.br15_jobs(
 id uuid primary key default gen_random_uuid(),booking_id uuid references public.br15_bookings,
 kind text not null,dedupe text not null unique,payload jsonb not null default '{}',
 state text not null default 'pending' check(state in ('pending','sending','sent','failed','uncertain','obsolete')),
 attempts int not null default 0,run_at timestamptz not null default now(),claimed_at timestamptz,provider_id text,error text);
create table if not exists public.br15_outlook(id boolean primary key default true check(id),encrypted text not null,calendar_id text,refreshed_at timestamptz,last_sync timestamptz,error text);
create table if not exists public.br15_outlook_events(booking_id uuid primary key references public.br15_bookings,event_id text not null unique,revision int not null default 0);
create table if not exists public.br15_oauth(state_hash text primary key,verifier text not null,expires timestamptz not null);
create table if not exists public.br15_limits(key text primary key,hits int not null,expires timestamptz not null);
-- Tout passe par les fonctions serveur, y compris après connexion Manager.
do $$ declare n text; begin
 for n in select tablename from pg_tables where schemaname='public' and tablename like 'br15_%' loop
 execute format('alter table public.%I enable row level security',n);
 execute format('revoke all on public.%I from anon, authenticated',n);
 execute format('grant all on public.%I to service_role',n);
 end loop;
end $$;
create or replace function public.br15_limit(p_key text,p_max int,p_seconds int) returns boolean language plpgsql security definer set search_path=public as $$
declare n int; begin
 insert into br15_limits values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set hits=case when br15_limits.expires<now() then 1 else br15_limits.hits+1 end,
 expires=case when br15_limits.expires<now() then now()+make_interval(secs=>p_seconds) else br15_limits.expires end returning hits into n;
 return n<=p_max; end $$;
create or replace function public.br15_quote(p_ids text[]) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;c int;settings br15_settings;pair jsonb; begin
 if cardinality(p_ids) is null or cardinality(p_ids)<1 or cardinality(p_ids)>12 then raise exception 'Sélection invalide'; end if;
 if cardinality(p_ids)<>(select count(distinct x) from unnest(p_ids)x) then raise exception 'Prestations en double'; end if;
 select * into settings from br15_settings where id;
 for pair in select * from jsonb_array_elements(settings.compatibility) loop
 if p_ids @> array[pair->>0,pair->>1] then raise exception 'Prestations incompatibles';end if;end loop;
 select count(*),jsonb_build_object('minutes',sum(minutes),'cents',sum(cents),'services',jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'path',s.path,'minutes',s.minutes,'cents',s.cents) order by array_position(p_ids,s.id))) into c,result from br15_services s where s.id=any(p_ids) and active;
 if c<>cardinality(p_ids) then raise exception 'Prestation indisponible';end if;
 if (result->>'minutes')::int>480 then raise exception 'Durée totale supérieure à 8 h : appeler Mélanie';end if;
 return result;end $$;
create or replace function public.br15_slots(p_date date,p_ids text[],p_exclude uuid default null) returns table(starts timestamptz,ends timestamptz) language plpgsql security definer set search_path=public as $$
declare s br15_settings;q jsonb;d int;b int; begin
 select * into s from br15_settings where id;
 if not s.enabled then return;end if;
 q:=br15_quote(p_ids); d:=(q->>'minutes')::int;b:=s.buffer_minutes;
 if p_date<(now() at time zone s.timezone)::date or p_date>(now() at time zone s.timezone)::date+s.horizon_days then return;end if;
 return query
 select distinct t,t+make_interval(mins=>d) from br15_hours h
 cross join lateral generate_series((p_date+h.opens) at time zone s.timezone, (p_date+h.closes) at time zone s.timezone-make_interval(mins=>d+b),interval '5 minutes') t
 where h.dow=extract(dow from p_date) and t>=now()+make_interval(mins=>s.lead_minutes)
 and not exists(select 1 from br15_blocks x where tstzrange(x.starts,x.ends,'[)') && tstzrange(t,t+make_interval(mins=>d+b),'[)'))
 and not exists(select 1 from br15_bookings x where x.status<>'annule' and (p_exclude is null or x.id<>p_exclude) and tstzrange(x.starts,x.busy_until,'[)') && tstzrange(t,t+make_interval(mins=>d+b),'[)')) order by t;
end $$;
create or replace function public.br15_enqueue(p_id uuid,p_event text) returns void language plpgsql security definer set search_path=public as $$
declare s br15_settings;r br15_bookings;k text; begin
 select * into s from br15_settings where id;select * into r from br15_bookings where id=p_id;
 update br15_jobs set state='obsolete' where booking_id=p_id and state in ('pending','failed') and kind='sms-reminder';
 if s.email_enabled then
 foreach k in array array['email-client','email-manager'] loop
 insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,k,p_id||':'||r.revision||':'||k,jsonb_build_object('event',p_event,'revision',r.revision)) on conflict do nothing;
 end loop;end if;
 if s.sms_confirmation then insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,'sms-confirmation',p_id||':'||r.revision||':sms',jsonb_build_object('event',p_event,'revision',r.revision)) on conflict do nothing;end if;
 if s.sms_reminder and r.status='confirme' and r.starts>now()+interval '24 hours' then
 insert into br15_jobs(booking_id,kind,dedupe,payload,run_at) values(p_id,'sms-reminder',p_id||':'||r.revision||':reminder',jsonb_build_object('event','rappel','revision',r.revision),r.starts-interval '24 hours') on conflict do nothing;end if;
 insert into br15_jobs(booking_id,kind,dedupe,payload) values(p_id,'outlook',p_id||':'||r.revision||':outlook',jsonb_build_object('revision',r.revision)) on conflict do nothing;
 end $$;
create or replace function public.br15_book(p_ids text[],p_start timestamptz,p_name text,p_email text,p_phone text,p_key uuid,p_hash text) returns jsonb language plpgsql security definer set search_path=public as $$
declare q jsonb;s br15_settings;r br15_bookings;c uuid;e timestamptz;begin
 perform pg_advisory_xact_lock(151515);
 select * into r from br15_bookings where request_key=p_key;
 if found then
 if r.token_hash<>p_hash then raise exception 'Clé déjà utilisée';end if;
 return to_jsonb(r)-'token_hash';end if;
 select * into s from br15_settings where id;
 if not s.enabled then raise exception 'Réservation native non ouverte';end if;
 if length(trim(p_name))<2 or length(p_name)>120 or length(p_email)>254 or p_email !~ '^[^ @]+@[^ @]+\.[^ @]+$' or p_phone !~ '^\+33[1-9][0-9]{8}$' then raise exception 'Coordonnées invalides';end if;
 q:=br15_quote(p_ids);
 select ends into e from br15_slots((p_start at time zone s.timezone)::date,p_ids) where starts=p_start;
 if e is null then raise exception 'Créneau indisponible';end if;
 insert into br15_clients(name,email,phone) values(trim(p_name),lower(trim(p_email)),p_phone) returning id into c;
 insert into br15_bookings(request_key,client_id,starts,ends,busy_until,cents,minutes,services,token_hash,token_expires)
 values(p_key,c,p_start,e,e+make_interval(mins=>s.buffer_minutes),(q->>'cents')::int,(q->>'minutes')::int,q->'services',p_hash,e+interval '7 days') returning * into r;
 perform br15_enqueue(r.id,'confirmation');return to_jsonb(r)-'token_hash';end $$;
create or replace function public.br15_change(p_id uuid,p_hash text,p_action text,p_start timestamptz default null,p_manager boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare r br15_bookings;s br15_settings;ids text[];e timestamptz;begin
 perform pg_advisory_xact_lock(151515);select * into r from br15_bookings where id=p_id for update;
 if not found then raise exception 'Rendez-vous introuvable';end if;
 if not p_manager and (p_hash<>r.token_hash or now()>r.token_expires) then raise exception 'Lien invalide ou expiré';end if;
 select * into s from br15_settings where id;
 if r.status='annule' and p_action='cancel' then return to_jsonb(r)-'token_hash';end if;
 if r.status<>'confirme' then raise exception 'Rendez-vous non modifiable';end if;
 if not p_manager and now()+make_interval(hours=>s.cancel_hours)>r.starts then raise exception 'Délai dépassé : contacter Mélanie';end if;
 if p_action='cancel' then update br15_bookings set status='annule',revision=revision+1 where id=p_id returning * into r;
 elsif p_action='move' then
 -- Durée et prix restent ceux validés lors de la réservation.
 select array_agg(x->>'id') into ids from jsonb_array_elements(r.services)x;
 select ends into e from br15_slots((p_start at time zone s.timezone)::date,ids,p_id) where starts=p_start;
 if e is null or e<>p_start+make_interval(mins=>r.minutes) then raise exception 'Créneau indisponible ou durée modifiée : contacter Mélanie';end if;
 update br15_bookings set starts=p_start,ends=e,busy_until=e+make_interval(mins=>s.buffer_minutes),token_expires=e+interval '7 days',revision=revision+1 where id=p_id returning * into r;
 elsif p_action='complete' and p_manager then update br15_bookings set status='termine',revision=revision+1 where id=p_id returning * into r;
 else raise exception 'Action invalide';end if;
 perform br15_enqueue(p_id,case p_action when 'cancel' then 'annulation' when 'move' then 'modification' else 'terminé' end);
 return to_jsonb(r)-'token_hash';end $$;
create or replace function public.br15_claim() returns setof br15_jobs language plpgsql security definer set search_path=public as $$
begin
 -- Un crash SMS peut correspondre à un envoi accepté. Pas de relance aveugle.
 update br15_jobs set state=case when kind like 'sms-%' then 'uncertain' else 'pending' end,error='Exécution interrompue' where state='sending' and claimed_at<now()-interval '10 minutes';
 return query with picked as (select id from br15_jobs where state in ('pending','failed') and run_at<=now() and attempts<5 order by run_at limit 1 for update skip locked)
 update br15_jobs j set state='sending',attempts=attempts+1,claimed_at=now() from picked where j.id=picked.id returning j.*;
end $$;
-- Toute modification des horaires/blocages/config utilise le même verrou que réserver.
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
 result:='{"ok":true}';
 elsif p_action='block' then
 if exists(select 1 from br15_bookings where status<>'annule' and tstzrange(starts,busy_until,'[)') && tstzrange((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,'[)')) then raise exception 'Un rendez-vous occupe cette période';end if;
 insert into br15_blocks(starts,ends,label) values((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,left(p_data->>'label',200)) returning to_jsonb(br15_blocks.*) into result;
 elsif p_action='unblock' then delete from br15_blocks where id=(p_data->>'id')::uuid and source='manager';result:='{"ok":true}';
 elsif p_action='client' then update br15_clients set notes=left(p_data->>'notes',4000) where id=(p_data->>'id')::uuid;result:='{"ok":true}';
 else raise exception 'Action inconnue';end if;return result;end $$;
-- Les RPC sont exclusivement accessibles à la clé serveur.
do $$ declare f record;begin for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname like 'br15_%' loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
commit;
