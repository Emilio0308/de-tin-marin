-- Admin product list: filtros frecuentes + búsqueda ILIKE name/sku (ProductSearchPicker).
-- Validar con EXPLAIN ANALYZE en staging antes de prod.

create extension if not exists pg_trgm with schema extensions;

create index if not exists products_active_not_deleted_name_idx
  on catalog.products (is_active, name, id)
  where deleted_at is null;

create index if not exists products_name_trgm_idx
  on catalog.products using gin (name extensions.gin_trgm_ops);

create index if not exists products_sku_trgm_idx
  on catalog.products using gin (sku extensions.gin_trgm_ops);
