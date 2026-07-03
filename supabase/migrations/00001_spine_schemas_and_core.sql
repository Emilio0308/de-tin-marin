-- S0: schemas + core spine tables (RLS enabled)

create schema if not exists core;
create schema if not exists catalog;
create schema if not exists pricing;
create schema if not exists commerce;
create schema if not exists crm;

-- core.profiles
create table if not exists core.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table core.profiles enable row level security;

create policy "profiles_select_own"
  on core.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on core.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- core.user_roles
create table if not exists core.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table core.user_roles enable row level security;

create policy "user_roles_select_own"
  on core.user_roles for select
  using (auth.uid() = user_id);

-- core.settings
create table if not exists core.settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table core.settings enable row level security;

create or replace function core.is_staff()
returns boolean
language sql
stable
security definer
set search_path = core
as $$
  select exists (
    select 1
    from core.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'super_admin')
  );
$$;

revoke all on function core.is_staff() from public;
grant execute on function core.is_staff() to authenticated;

create policy "settings_select_staff"
  on core.settings for select
  using (core.is_staff());

-- core.audit_log (server-only writes in app; no client select in S0)
create table if not exists core.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table core.audit_log enable row level security;

-- No policies for anon/authenticated on audit_log in S0 — service role only

create or replace function core.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on core.profiles
  for each row execute function core.set_updated_at();
