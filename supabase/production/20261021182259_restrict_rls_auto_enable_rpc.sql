-- Renforce les permissions sans désactiver le déclencheur automatique RLS.
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
