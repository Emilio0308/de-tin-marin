-- Per-bundle customization min/max product counts (ecommerce wizard + order personalization).
-- Defaults preserve prior global behavior (8 / 20).

alter table catalog.bundles
  add column if not exists customization_min_products int not null default 8,
  add column if not exists customization_max_products int not null default 20;

update catalog.bundles
set
  customization_min_products = coalesce(customization_min_products, 8),
  customization_max_products = coalesce(customization_max_products, 20)
where true;

alter table catalog.bundles
  drop constraint if exists bundles_customization_min_positive;

alter table catalog.bundles
  drop constraint if exists bundles_customization_max_positive;

alter table catalog.bundles
  drop constraint if exists bundles_customization_min_le_max;

alter table catalog.bundles
  add constraint bundles_customization_min_positive
    check (customization_min_products >= 1);

alter table catalog.bundles
  add constraint bundles_customization_max_positive
    check (customization_max_products >= 1);

alter table catalog.bundles
  add constraint bundles_customization_min_le_max
    check (customization_min_products <= customization_max_products);

comment on column catalog.bundles.customization_min_products is
  'Minimum distinct products required when personalizing this surprise (wizard / order form).';

comment on column catalog.bundles.customization_max_products is
  'Maximum distinct products allowed when personalizing this surprise (wizard / order form).';
