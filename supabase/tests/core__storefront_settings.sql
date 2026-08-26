begin;
select plan(4);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.storefront_settings'::regclass),
  'RLS enabled on core.storefront_settings'
);

select ok(
  (select count(*)::int from core.storefront_settings where singleton_key = 'default') = 1,
  'default storefront_settings row exists'
);

select ok(
  (
    select free_delivery = false
      and free_pickup_point = false
      and min_order_subtotal = 0
      and announcement_enabled = false
    from core.storefront_settings
    where singleton_key = 'default'
  ),
  'default storefront_settings values are off / zero'
);

select throws_ok(
  $$
    update core.storefront_settings
    set
      free_fulfillment_starts_at = '2026-08-20T00:00:00Z',
      free_fulfillment_ends_at = '2026-08-10T00:00:00Z'
    where singleton_key = 'default'
  $$,
  '23514',
  null,
  'free fulfillment window rejects ends_at <= starts_at'
);

select * from finish();
rollback;
