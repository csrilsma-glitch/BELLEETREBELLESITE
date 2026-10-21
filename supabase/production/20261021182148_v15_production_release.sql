-- Mise à niveau atomique du schéma existant ; aucune donnée de test importée.
BEGIN;
-- Source: 20261019185534_v15_schema.sql sha256=9bf4354343cbe196eb23efd1fef4a3e69d0e6518992b6b4ee608391144cd8615

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

-- Source: 20261019185541_v15_catalogue.sql sha256=ddd0110f3f9fb1d336c51a01bde0c7ee2f80e52f858abbbbcc9b7e974bd0ae77

insert into public.br15_services(id,name,path,minutes,cents,position) values('gel-gainage','Gel sans rallongement','Onglerie › Prestations Gel › Gel sans rallongement',90,5200,1) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('gel-chablon','Extension chablon','Onglerie › Prestations Gel › Extension chablon',120,6000,2) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('gel-premiere','Première pose sur ongles rongés','Onglerie › Prestations Gel › Première pose sur ongles rongés',75,5500,3) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('gel-remp-34','Remplissage en 3 et 4 semaines de repousses','Onglerie › Prestations Gel › Remplissage en 3 et 4 semaines de repousses',90,4500,4) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('gel-remp-5','Remplissage après 5 semaines de repousses','Onglerie › Prestations Gel › Remplissage après 5 semaines de repousses',90,4900,5) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('am-courte','Courte ou medium','Onglerie › Prestations Capsules › Pose américaine › Courte ou medium',90,4800,6) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('am-longue','Longue','Onglerie › Prestations Capsules › Pose américaine › Longue',90,5800,7) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('popits-court','Popits court ou medium','Onglerie › Prestations Capsules › Rallongement popits et demi popits › Popits court ou medium',120,5500,8) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('popits-long','Popits long','Onglerie › Prestations Capsules › Rallongement popits et demi popits › Popits long',150,6300,9) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('demi-court','Demi popits court ou medium','Onglerie › Prestations Capsules › Rallongement popits et demi popits › Demi popits court ou medium',120,5900,10) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('demi-long','Demi popits long','Onglerie › Prestations Capsules › Rallongement popits et demi popits › Demi popits long',150,6600,11) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('popits-amande','Popits amandes Russes','Onglerie › Prestations Capsules › Rallongement popits et demi popits › Popits amandes Russes',180,7000,12) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('semi-main-1','Semi permanent main première pose','Onglerie › Semi-permanent › Semi permanent main première pose',45,3500,13) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('semi-main-entretien','Entretien semi permanent mains','Onglerie › Semi-permanent › Entretien semi permanent mains',45,4000,14) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('semi-pied-1','Semi permanent pied première pose','Onglerie › Semi-permanent › Semi permanent pied première pose',45,3200,15) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('semi-pied-entretien','Entretien semi permanent pieds','Onglerie › Semi-permanent › Entretien semi permanent pieds',45,3600,16) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('deco-simple-unite','Déco très simple à l’unité','Onglerie › Déco / Nail Arts › Déco simple › Déco très simple à l’unité',15,200,17) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('deco-simple-mains','Déco très simple forfait mains complètes','Onglerie › Déco / Nail Arts › Déco simple › Déco très simple forfait mains complètes',30,1400,18) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fc-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French classique › Deux doigts',5,400,19) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fc-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French classique › Quatre doigts',10,800,20) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fc-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French classique › Six doigts',20,1200,21) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fc-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › French classique › Mains complètes',30,1400,22) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fo-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French originale › Deux doigts',5,600,23) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fo-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French originale › Quatre doigts',10,1200,24) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fo-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French originale › Six doigts',20,1800,25) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fo-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › French originale › Mains complètes',30,2100,26) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fr-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French reverse › Deux doigts',20,1000,27) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fr-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French reverse › Quatre doigts',30,1800,28) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fr-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › French reverse › Six doigts',40,2600,29) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('fr-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › French reverse › Mains complètes',60,3000,30) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-s2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Simple › Deux doigts',5,600,31) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-s4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Simple › Quatre doigts',10,1200,32) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-s6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Simple › Six doigts',15,1800,33) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-smains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Simple › Mains complètes',20,2100,34) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-c2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Complexe › Deux doigts',10,800,35) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-c4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Complexe › Quatre doigts',20,1600,36) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-c6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Complexe › Six doigts',40,2400,37) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dp-cmains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Décos personnalisées › Complexe › Mains complètes',50,2800,38) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('bb-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Babyboomer / babycolor › Deux doigts',10,700,39) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('bb-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Babyboomer / babycolor › Quatre doigts',20,1400,40) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('bb-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Babyboomer / babycolor › Six doigts',30,2100,41) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('bb-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Babyboomer / babycolor › Mains complètes',40,2500,42) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('inc-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Incrustation complète › Deux doigts',10,600,43) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('inc-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Incrustation complète › Quatre doigts',20,1200,44) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('inc-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Incrustation complète › Six doigts',30,1800,45) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('inc-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Incrustation complète › Mains complètes',40,2100,46) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('relief-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Déco relief › Deux doigts',10,800,47) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('relief-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Déco relief › Quatre doigts',20,1600,48) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('relief-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Déco relief › Six doigts',30,2400,49) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('relief-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Déco relief › Mains complètes',40,2800,50) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('stk-2','Deux doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Stickers faits mains › Deux doigts',5,1400,51) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('stk-4','Quatre doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Stickers faits mains › Quatre doigts',10,2200,52) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('stk-6','Six doigts','Onglerie › Déco / Nail Arts › Déco élaborée › Stickers faits mains › Six doigts',15,3000,53) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('stk-mains','Mains complètes','Onglerie › Déco / Nail Arts › Déco élaborée › Stickers faits mains › Mains complètes',20,3800,54) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('casse-1','Réparation ongle cassé la 1ère semaine','Onglerie › En cas de casse › Réparation ongle cassé la 1ère semaine',15,0,55) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('casse-2','Réparation à partir de la 2ème semaine hors remplissage','Onglerie › En cas de casse › Réparation à partir de la 2ème semaine hors remplissage',15,400,56) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('casse-3','Réparation ongle cassé pendant le remplissage','Onglerie › En cas de casse › Réparation ongle cassé pendant le remplissage',15,200,57) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dep-travail','Dépose complète de mon travail','Onglerie › Les déposes › Dépose complète de mon travail',30,2000,58) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dep-autre','Dépose complète autre professionnelle','Onglerie › Les déposes › Dépose complète autre professionnelle',30,2500,59) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dep-autre-repose','Dépose complète autre professionnelle avec repose','Onglerie › Les déposes › Dépose complète autre professionnelle avec repose',30,1000,60) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dep-semi','Dépose semi permanent','Onglerie › Les déposes › Dépose semi permanent',20,1200,61) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('dep-rattrapage','Rattrapage autre professionnelle','Onglerie › Les déposes › Rattrapage autre professionnelle',30,800,62) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('press-kit','Kit complet + prise de mesure','Press on nails › Kit complet + prise de mesure',30,3000,63) on conflict(id) do nothing;
insert into public.br15_services(id,name,path,minutes,cents,position) values('press-kit-seul','Kit complet uniquement','Press on nails › Kit complet uniquement',30,2500,64) on conflict(id) do nothing;

-- Source: 20261019185629_v15_outlook.sql sha256=33b15ada1763b448311cb5af71cbf8822ab7e7a59819c20211943b76088c97a4

create or replace function public.br15_outlook_blocks(p_blocks jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(151515);
 delete from br15_blocks where source='outlook';
 insert into br15_blocks(starts,ends,label,source,external_id) select (x->>'starts')::timestamptz,(x->>'ends')::timestamptz,'Occupé dans Outlook','outlook',x->>'external_id' from jsonb_array_elements(p_blocks)x;
end $$;
revoke all on function public.br15_outlook_blocks(jsonb) from public,anon,authenticated;
grant execute on function public.br15_outlook_blocks(jsonb) to service_role;

-- Source: 20261019185635_v15_privacy.sql sha256=a22db7a9d7eaa56b82cc204e7dff1a5dbfdeb029ef1659e74a10dbf303689810

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

-- Source: 20261019185911_email_reminders.sql sha256=416d6c5aa910ba9ea86e743920fb8a7850e260fe73bb07a39433c3cfac70fd63
-- Ajoute les rappels e-mail, sans changer les réglages SMS ni les données clientes.

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

-- Source: 20261020171558_no_completion_notice.sql sha256=69dfd580deb3315bcfe47aa0f348784bdd069ada05d30875fc165d28973341b7
-- Une prestation marquée « terminée » par Mélanie ne doit générer aucune notification (ni cliente, ni Mélanie).
-- Les rappels encore en attente sont tout de même rendus obsolètes. Corps identique à la version précédente, hors garde.

create or replace function public.br15_enqueue(p_id uuid,p_event text) returns void language plpgsql security definer set search_path=public as $$
declare s br15_settings;r br15_bookings;k text; begin
 select * into s from br15_settings where id;select * into r from br15_bookings where id=p_id;
 update br15_jobs set state='obsolete' where booking_id=p_id and state in ('pending','failed') and kind in ('sms-reminder','email-reminder');
 if p_event='terminé' then return; end if;
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

-- Source: 20261020182713_realtest_flag.sql sha256=80942b06f470171ed39d9894017466e46907c57d3a01866f4a3381946c3b6765
-- Essais réels de notifications (préproduction) : marquage explicite d'une réservation.
-- Colonne vide par défaut : aucune réservation n'envoie de vrai e-mail ou SMS tant que l'opérateur ne la marque pas.
alter table public.br15_bookings add column if not exists real_test_until timestamptz;
comment on column public.br15_bookings.real_test_until is 'Préproduction uniquement : envois réels e-mail/SMS de confirmation jusqu''à cet instant. Null = simulé.';

-- Source: 20261021061311_move_btree_gist_to_extensions.sql sha256=40b845cb8fb152a28d68ed0ff1e99702f4351612dc4c9370efbe8d6b16a3a2ba
-- Appliquée uniquement sur xrpjrweqdhihloykabml le 21 octobre 2026.
-- Ne pas appliquer en production sans recette et autorisation de bascule.
-- Pas de DROP/CREATE : OID, données et contraintes existantes conservés.
DO $$ BEGIN IF (SELECT extnamespace FROM pg_extension WHERE extname='btree_gist') <> 'extensions'::regnamespace THEN ALTER EXTENSION btree_gist SET SCHEMA extensions; END IF; END $$;

-- Source: 20261021063959_admin_json_results.sql sha256=c783fa241b5a0d1e6eaaa7e4e257fc8e2e6cf26cddb06e7c97332892d98dabb1
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

-- Source: 20261021064110_diagnose_hours_save_test_only.sql sha256=fef2b7a7ddf807d40f21fa49f3aae0e41ad5c38ac516c61dff435d7d1258b9e7
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
 else raise exception 'Action inconnue';end if;return result;exception when others then
 if p_action='hours' then raise exception 'Horaires refusés : %', SQLERRM;else raise;end if;
end $$;


-- Source: 20261021064201_admin_hours_safe_update_compatible.sql sha256=c04729039ddb1b38c4f52655e9c03c56324a857ced335f2db8575c85ab37d698
-- Préproduction : remplacement explicite des plages, compatible Safe Updates.
-- WHERE id IS NOT NULL sélectionne les anciennes plages dans la transaction atomique.
create or replace function public.br15_admin(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin
 perform pg_advisory_xact_lock(151515);
 if p_action='settings' then
 if (p_data->>'enabled')::boolean and (not exists(select 1 from br15_hours) or coalesce(p_data->>'privacy_text','')='') then raise exception 'Horaires et information clientèle requis';end if;
 update br15_settings set enabled=coalesce((p_data->>'enabled')::boolean,enabled),lead_minutes=coalesce((p_data->>'lead_minutes')::int,lead_minutes),horizon_days=coalesce((p_data->>'horizon_days')::int,horizon_days),buffer_minutes=coalesce((p_data->>'buffer_minutes')::int,buffer_minutes),cancel_hours=coalesce((p_data->>'cancel_hours')::int,cancel_hours),sms_confirmation=coalesce((p_data->>'sms_confirmation')::boolean,sms_confirmation),sms_reminder=coalesce((p_data->>'sms_reminder')::boolean,sms_reminder),email_enabled=coalesce((p_data->>'email_enabled')::boolean,email_enabled),outlook_required=coalesce((p_data->>'outlook_required')::boolean,outlook_required),privacy_text=coalesce(p_data->>'privacy_text',privacy_text),retention_days=coalesce((p_data->>'retention_days')::int,retention_days),compatibility=coalesce(p_data->'compatibility',compatibility) where id returning to_jsonb(br15_settings.*) into result;
 elsif p_action='service' then update br15_services set name=p_data->>'name',path=p_data->>'path',minutes=(p_data->>'minutes')::int,cents=(p_data->>'cents')::int,position=(p_data->>'position')::int,active=(p_data->>'active')::boolean where id=p_data->>'id' returning to_jsonb(br15_services.*) into result;
 elsif p_action='hours' then
 delete from br15_hours where id is not null;
 insert into br15_hours(dow,opens,closes) select (x->>'dow')::int,(x->>'opens')::time,(x->>'closes')::time from jsonb_array_elements(p_data->'hours')x;
 result:=jsonb_build_object('ok',true);
 elsif p_action='block' then
 if exists(select 1 from br15_bookings where status<>'annule' and tstzrange(starts,busy_until,'[)') && tstzrange((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,'[)')) then raise exception 'Un rendez-vous occupe cette période';end if;
 insert into br15_blocks(starts,ends,label) values((p_data->>'starts')::timestamptz,(p_data->>'ends')::timestamptz,left(p_data->>'label',200)) returning to_jsonb(br15_blocks.*) into result;
 elsif p_action='unblock' then delete from br15_blocks where id=(p_data->>'id')::uuid and source='manager';result:=jsonb_build_object('ok',true);
 elsif p_action='client' then update br15_clients set notes=left(p_data->>'notes',4000) where id=(p_data->>'id')::uuid;result:=jsonb_build_object('ok',true);
 else raise exception 'Action inconnue';end if;return result;end $$;



-- Source: 20261021085503_manager_blocks_outlook.sql sha256=c3589d002fe7684115bdff5222a987c32503eb959a810fda1f9df60c7b3f1f43

-- État durable indépendant de la pause : sa suppression conserve la demande de retrait Outlook.
create table public.br15_block_outlook(
 block_id uuid primary key, revision int not null default 1, desired jsonb,
 event_id text unique, calendar_id text, synced_revision int not null default 0,
 lease_until timestamptz, lease_token uuid);
alter table public.br15_block_outlook enable row level security;
revoke all on public.br15_block_outlook from public,anon,authenticated;
grant all on public.br15_block_outlook to service_role;
create function public.br15_queue_block_outlook() returns trigger language plpgsql security definer set search_path=public as $$
declare r br15_blocks;v int;d jsonb;begin
 if TG_OP='DELETE' then r:=OLD;else r:=NEW;end if;
 if r.source<>'manager' then return null;end if;
 if TG_OP<>'DELETE' then d:=jsonb_build_object('starts',r.starts,'ends',r.ends,'label',r.label);end if;
 insert into br15_block_outlook(block_id,desired) values(r.id,d)
 on conflict(block_id) do update set revision=br15_block_outlook.revision+1,desired=excluded.desired returning revision into v;
 update br15_jobs set state='obsolete' where kind='outlook-block' and payload->>'block_id'=r.id::text and state in('pending','failed');
 insert into br15_jobs(kind,dedupe,payload) values('outlook-block',r.id||':block:'||v,jsonb_build_object('block_id',r.id,'revision',v));
 return null;end $$;
create trigger br15_block_outlook_queue after insert or update or delete on public.br15_blocks for each row execute function public.br15_queue_block_outlook();
create function public.br15_block_lease(p_id uuid,p_revision int,p_token uuid,p_release boolean default false) returns boolean language plpgsql security definer set search_path=public as $$
declare n int;begin
 if p_release then update br15_block_outlook set lease_until=null,lease_token=null where block_id=p_id and lease_token=p_token;
 else update br15_block_outlook set lease_until=now()+interval '2 minutes',lease_token=p_token where block_id=p_id and revision=p_revision and (lease_until is null or lease_until<now());end if;
 get diagnostics n=row_count;return n=1;end $$;
create function public.br15_update_block(p_id uuid,p_starts timestamptz,p_ends timestamptz,p_label text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r br15_blocks;begin
 perform pg_advisory_xact_lock(151515);
 if p_ends<=p_starts or length(trim(p_label))=0 then raise exception 'Horaires ou motif invalides';end if;
 if exists(select 1 from br15_bookings where status<>'annule' and tstzrange(starts,busy_until,'[)') && tstzrange(p_starts,p_ends,'[)')) then raise exception 'Un rendez-vous occupe cette période';end if;
 update br15_blocks set starts=p_starts,ends=p_ends,label=left(trim(p_label),200) where id=p_id and source='manager' returning * into r;
 if not found then raise exception 'Action indisponible';end if;
 return to_jsonb(r);end $$;
revoke all on function public.br15_queue_block_outlook(),public.br15_block_lease(uuid,int,uuid,boolean),public.br15_update_block(uuid,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.br15_block_lease(uuid,int,uuid,boolean),public.br15_update_block(uuid,timestamptz,timestamptz,text) to service_role;
-- Rattrapage des pauses existantes sans changement de dates, ni appel Microsoft.
insert into br15_block_outlook(block_id,desired) select id,jsonb_build_object('starts',starts,'ends',ends,'label',label) from br15_blocks where source='manager';
-- Laisser le temps de déployer le worker compatible avant le rattrapage initial.
insert into br15_jobs(kind,dedupe,payload,run_at) select 'outlook-block',block_id||':block:'||revision,jsonb_build_object('block_id',block_id,'revision',revision),now()+interval '10 minutes' from br15_block_outlook;

COMMIT;
