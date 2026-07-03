-- S1A fix: API role privileges for custom schemas.
--
-- Exposing a schema via PostgREST (Settings -> API -> Exposed schemas) is NOT
-- enough: the API roles (anon, authenticated) also need database-level USAGE on
-- the schema plus privileges on its tables/functions. The `public` schema gets
-- these grants automatically in Supabase; custom schemas do not.
--
-- Row Level Security still governs WHICH rows each role can see or modify.

-- core --------------------------------------------------------------------
grant usage on schema core to anon, authenticated;

-- Signed-in users read their own profile/role and staff settings (RLS-limited).
grant select on core.profiles, core.user_roles, core.settings to authenticated;
grant update on core.profiles to authenticated;

-- catalog SELECT policies call core.is_staff(); anon must be able to execute it
-- while those policies are evaluated during storefront reads.
grant execute on function core.is_staff() to anon;

-- catalog -----------------------------------------------------------------
grant usage on schema catalog to anon, authenticated;

-- Public storefront reads active rows; staff manages the catalog (RLS enforced
-- via core.is_staff()).
grant select on catalog.categories, catalog.products to anon, authenticated;
grant insert, update, delete on catalog.categories, catalog.products to authenticated;
