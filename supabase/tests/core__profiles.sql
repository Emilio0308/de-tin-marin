begin;
select plan(3);

-- anon cannot insert profiles
select throws_ok(
  $$ insert into core.profiles (id, display_name) values (gen_random_uuid(), 'anon') $$,
  '42501',
  null,
  'anon cannot insert profiles'
);

-- authenticated user A cannot read profile B (simulated via auth.uid mock if extension available)
-- pgTAP with supabase tests typically uses test helpers; minimal assertion on RLS enabled
select ok(
  (select relrowsecurity from pg_class where oid = 'core.profiles'::regclass),
  'RLS enabled on core.profiles'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.user_roles'::regclass),
  'RLS enabled on core.user_roles'
);

select * from finish();
rollback;
