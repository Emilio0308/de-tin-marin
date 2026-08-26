begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.about_page_settings'::regclass),
  'RLS enabled on core.about_page_settings'
);

select ok(
  (select count(*)::int from core.about_page_settings where singleton_key = 'default') = 1,
  'default about_page_settings row exists'
);

select * from finish();
rollback;
