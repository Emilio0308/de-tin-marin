-- Product supplier cost (admin backoffice; margin derived in app)

alter table catalog.products
  add column if not exists cost_net_price numeric(12, 2);

alter table catalog.products
  drop constraint if exists products_cost_net_price_nonnegative;

alter table catalog.products
  add constraint products_cost_net_price_nonnegative
    check (cost_net_price is null or cost_net_price >= 0);
