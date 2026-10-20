// Exécuté séparément avec PGlite : aucune connexion réseau, aucun fournisseur.
const {PGlite}=require('@electric-sql/pglite'),{btree_gist}=require('@electric-sql/pglite/contrib/btree_gist');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite({extensions:{btree_gist}});await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);');
for(const f of ['001_v15.sql','002_catalogue.sql','003_outlook.sql','004_privacy.sql'])await db.exec(fs.readFileSync('supabase/'+f,'utf8'));
for(const f of fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort())await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
await db.exec("insert into br15_hours(dow,opens,closes) select n,'10:00','19:00' from generate_series(0,6)n;update br15_settings set enabled=true,lead_minutes=0,email_enabled=true,sms_reminder=true,cancel_hours=24");
const q=(s,a=[])=>db.query(s,a),v=async(s,a)=>(await q(s,a)).rows[0].v;
const ids=['gel-gainage','deco-simple-unite','fc-2'];const date=await v("select ((now() at time zone 'Europe/Paris')::date+8)::text v");const slots=(await q('select * from br15_slots($1,$2)',[date,ids])).rows;
const b=await v("select br15_book($1,$2,'Test','test@example.test','+33600000000','11111111-1111-4111-8111-111111111111','testhash') v",[ids,slots[0].starts]);
async function reminders(revision){const rows=(await q("select kind,run_at from br15_jobs where booking_id=$1 and state='pending' and kind in ('email-reminder','sms-reminder') and (payload->>'revision')::int=$2",[b.id,revision])).rows;assert.equal(rows.length,2);return rows;}
for(const r of await reminders(1))assert.equal(Date.parse(r.run_at),Date.parse(b.starts)-86400000);
await q("select br15_enqueue($1,'confirmation')",[b.id]);assert.equal((await q('select dedupe,count(*) from br15_jobs group by dedupe having count(*)>1')).rows.length,0);
const moved=await v("select br15_change($1,'testhash','move',$2) v",[b.id,slots[4].starts]);for(const r of await reminders(2))assert.equal(Date.parse(r.run_at),Date.parse(moved.starts)-86400000);
assert.equal(await v("select count(*)::int v from br15_jobs where booking_id=$1 and kind like '%-reminder' and state='pending' and payload->>'revision'='1'",[b.id]),0);
await q("select br15_change($1,'testhash','cancel')",[b.id]);assert.equal(await v("select count(*)::int v from br15_jobs where booking_id=$1 and kind like '%-reminder' and state='pending'",[b.id]),0);
await q("select br15_change($1,'testhash','cancel')",[b.id]);assert.equal(await v('select revision v from br15_bookings where id=$1',[b.id]),3);
// Délai cliente réellement appliqué ; le Manager conserve son action autorisée.
const future=await v("select br15_book($1,$2,'Test','short@example.test','+33600000001','22222222-2222-4222-8222-222222222222','short') v",[ids,slots[0].starts]);
await q("update br15_bookings set starts=now()+interval '23 hours',ends=now()+interval '25 hours',busy_until=now()+interval '25 hours' where id=$1",[future.id]);await assert.rejects(q("select br15_change($1,'short','cancel')",[future.id]),/Délai/);
// Une location interrompue ne renvoie jamais aveuglément un SMS.
await q("update br15_jobs set state='sending',claimed_at=now()-interval '11 minutes' where booking_id=$1 and kind in ('email-client','sms-reminder')",[future.id]);await q('select * from br15_claim()');
assert.equal(await v("select state v from br15_jobs where booking_id=$1 and kind='sms-reminder'",[future.id]),'uncertain');
await db.close();console.log('Rappels email/SMS 24h, déplacement, obsolescence, annulation répétée, délai 24h, reprise après crash : OK');})().catch(e=>{console.error(e);process.exitCode=1});
