begin;
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
insert into br15_jobs(kind,dedupe,payload) select 'outlook-block',block_id||':block:'||revision,jsonb_build_object('block_id',block_id,'revision',revision) from br15_block_outlook;
commit;
