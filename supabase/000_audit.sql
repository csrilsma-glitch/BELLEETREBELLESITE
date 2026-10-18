-- À exécuter AVANT migration sur le vrai projet. Ne modifie rien.
select table_name,column_name,data_type,is_nullable from information_schema.columns
where table_schema='public' and table_name like 'br_%' order by table_name,ordinal_position;
select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'br_%';
select conname,pg_get_constraintdef(oid) from pg_constraint where connamespace='public'::regnamespace;
select routine_name,security_type from information_schema.routines where routine_schema='public';
