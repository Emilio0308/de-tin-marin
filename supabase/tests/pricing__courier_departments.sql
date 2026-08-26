begin;
select plan(8);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'pricing.courier_departments'::regclass
  ),
  'RLS enabled on pricing.courier_departments'
);

select ok(
  (
    select count(*)::int >= 3
    from pricing.courier_departments
    where name in ('Lima', 'Lambayeque', 'Piura')
  ),
  'seed courier departments exist'
);

select ok(
  (
    select count(*)::int = 0
    from pricing.courier_departments d,
      jsonb_array_elements(d.provinces) p
    where d.name = 'Piura'
      and p ->> 'slug' = 'piura'
  ),
  'Piura department seed excludes piura province'
);

select ok(
  (
    select count(*)::int = 7
    from pricing.courier_departments d,
      jsonb_array_elements(d.provinces) p
    where d.name = 'Piura'
  ),
  'Piura department seed has seven provinces'
);

select ok(
  (
    select courier_enabled = false
    from pricing.delivery_settings
    where singleton_key = 'default'
  ),
  'courier_enabled defaults to false'
);

select ok(
  (
    select count(*)::int > 0
    from pg_policies
    where schemaname = 'pricing'
      and tablename = 'courier_departments'
      and policyname = 'courier_departments_select_public'
  ),
  'courier_departments_select_public policy exists'
);

select ok(
  (
    select count(*)::int > 0
    from pg_policies
    where schemaname = 'pricing'
      and tablename = 'courier_departments'
      and policyname = 'courier_departments_select_staff'
  ),
  'courier_departments_select_staff policy exists'
);

select ok(
  (
    select bool_and(is_active = false)
    from pricing.courier_departments
    where name in ('Lima', 'Lambayeque', 'Piura')
  ),
  'seed courier departments are inactive by default'
);

select * from finish();
rollback;
