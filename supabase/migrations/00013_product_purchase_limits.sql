-- Product purchase quantity limits (presentation units; not bundles/wizard)

alter table catalog.products
  add column if not exists purchase_min_quantity int not null default 10,
  add column if not exists purchase_max_quantity int not null default 100;

alter table catalog.products
  drop constraint if exists products_purchase_min_positive;

alter table catalog.products
  add constraint products_purchase_min_positive
    check (purchase_min_quantity >= 1);

alter table catalog.products
  drop constraint if exists products_purchase_max_gte_min;

alter table catalog.products
  add constraint products_purchase_max_gte_min
    check (purchase_max_quantity >= purchase_min_quantity);
