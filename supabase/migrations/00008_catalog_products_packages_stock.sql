-- S1D: catalog.products — presentaciones, prices.unit, stock sealed/loose

alter table catalog.products
  add column if not exists product_type text not null default 'unit',
  add column if not exists items_per_package int not null default 1,
  add column if not exists package_label text,
  add column if not exists stock_sealed_packages int not null default 0,
  add column if not exists stock_loose_base_units int not null default 0;

update catalog.products
set
  stock_sealed_packages = 0,
  stock_loose_base_units = coalesce(stock_quantity, 0)
where stock_quantity is not null;

update catalog.products
set prices = jsonb_set(
  prices,
  '{unit}',
  coalesce(prices -> 'unit', prices -> 'normal'),
  true
)
where prices -> 'unit' is null;

alter table catalog.products
  drop constraint if exists products_stock_quantity_non_negative;

alter table catalog.products
  drop column if exists stock_quantity;

alter table catalog.products
  add constraint products_product_type_check
    check (product_type in ('unit', 'package')),
  add constraint products_items_per_package_positive
    check (items_per_package >= 1),
  add constraint products_stock_sealed_packages_non_negative
    check (stock_sealed_packages >= 0),
  add constraint products_stock_loose_base_units_non_negative
    check (stock_loose_base_units >= 0);

alter table catalog.products
  alter column prices
  set default '{"normal":{"netPrice":0,"igv":0,"subtotal":0},"unit":{"netPrice":0,"igv":0,"subtotal":0},"suggested":{},"fantasy":{}}'::jsonb;
