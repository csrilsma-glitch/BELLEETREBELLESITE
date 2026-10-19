-- À exécuter UNIQUEMENT sur belleetrebelle-v15-preproduction.
-- Données fictives, transaction annulée ; aucun appel à un fournisseur.
begin;
do $$
declare q jsonb; b jsonb; t timestamptz; moved timestamptz; rejected boolean;
 ids text[]:=array['gel-gainage','deco-simple-unite'];
 key uuid:=gen_random_uuid(); bid uuid;
begin
 if (select count(*) from br15_services)<>64 then raise exception 'Catalogue incomplet';end if;
 q:=br15_quote(ids);
 if (q->>'minutes')::int<>105 or (q->>'cents')::int<>5400 then raise exception 'Total incorrect';end if;
 select starts into t from br15_slots((now() at time zone 'Europe/Paris')::date+7,ids) limit 1;
 if t is null then raise exception 'Aucun créneau test';end if;
 b:=br15_book(ids,t,'Cliente fictive V15','nobody@example.test','+33600000000',key,'test-only-hash');bid:=(b->>'id')::uuid;
 if (br15_book(ids,t,'Cliente fictive V15','nobody@example.test','+33600000000',key,'test-only-hash')->>'id')::uuid<>bid then raise exception 'Idempotence incorrecte';end if;
 if (select count(*) from br15_jobs where booking_id=bid and kind='email-reminder' and run_at=t-interval '24 hours')<>1 then raise exception 'Rappel e-mail absent';end if;
 if exists(select 1 from br15_jobs where booking_id=bid and kind like 'sms-%') then raise exception 'SMS activé';end if;
 rejected:=false;
 begin perform br15_change(bid,'forged','cancel');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Lien forgé accepté';end if;
 select starts into moved from br15_slots((t at time zone 'Europe/Paris')::date,ids,bid) where starts>t+interval '2 hours' limit 1;
 if moved is null then raise exception 'Déplacement indisponible';end if;
 perform br15_change(bid,'test-only-hash','move',moved);
 if (select count(*) from br15_jobs where booking_id=bid and kind='email-reminder' and state='obsolete')<>1 then raise exception 'Ancien rappel conservé';end if;
 if (select count(*) from br15_jobs where booking_id=bid and kind='email-reminder' and state='pending' and run_at=moved-interval '24 hours')<>1 then raise exception 'Nouveau rappel absent';end if;
 perform br15_change(bid,'test-only-hash','cancel');
 if exists(select 1 from br15_jobs where booking_id=bid and kind='email-reminder' and state='pending') then raise exception 'Rappel après annulation';end if;
 -- Vérification de la limite des 24 h sur un nouveau rendez-vous fictif.
 b:=br15_book(ids,t,'Cliente fictive V15','nobody@example.test','+33600000000',gen_random_uuid(),'test-only-hash');bid:=(b->>'id')::uuid;
 update br15_bookings set starts=now()+interval '23 hours',ends=now()+interval '24 hours 45 minutes',busy_until=now()+interval '24 hours 45 minutes' where id=bid;
 rejected:=false;
 begin perform br15_change(bid,'test-only-hash','cancel');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Annulation sous 24 h acceptée';end if;
end $$;
rollback;
select 'PASS : catalogue, totaux, création, idempotence, rappel 24 h, lien forgé, déplacement, annulation, délai 24 h, SMS désactivés' as resultat;
