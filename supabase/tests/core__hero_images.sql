begin;
select plan(3);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.hero_images'::regclass),
  'RLS enabled on core.hero_images'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'hero_images_ends_after_starts'
  ),
  'ends_at > starts_at constraint exists'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'core'
      and indexname = 'hero_images_active_sort_idx'
  ),
  'active sort index exists'
);

select * from finish();
rollback;
