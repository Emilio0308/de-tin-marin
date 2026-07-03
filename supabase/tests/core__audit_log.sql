begin;
select plan(1);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.audit_log'::regclass),
  'RLS enabled on core.audit_log'
);

select * from finish();
rollback;
