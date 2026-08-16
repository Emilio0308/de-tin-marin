-- Public contact + payment instructions (singleton, staff-editable)

create table if not exists core.public_business_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  whatsapp_e164 text not null,
  email text not null,
  yape_phone text not null,
  yape_holder_name text not null,
  bank_name text not null,
  bank_account_holder_name text not null,
  bank_account_number text not null,
  bank_interbank_account_number text not null,
  updated_at timestamptz not null default now(),
  constraint public_business_settings_singleton_key unique (singleton_key),
  constraint public_business_settings_whatsapp_e164_check
    check (whatsapp_e164 ~ '^[1-9][0-9]{10,14}$'),
  constraint public_business_settings_email_check
    check (position('@' in email) > 1),
  constraint public_business_settings_yape_phone_check
    check (yape_phone ~ '^9[0-9]{8}$'),
  constraint public_business_settings_cci_check
    check (bank_interbank_account_number ~ '^[0-9]{20}$')
);

insert into core.public_business_settings (
  singleton_key,
  whatsapp_e164,
  email,
  yape_phone,
  yape_holder_name,
  bank_name,
  bank_account_holder_name,
  bank_account_number,
  bank_interbank_account_number
)
values (
  'default',
  '51980966238',
  'detinmarindulcesyconfiteria@gmail.com',
  '999888777',
  'De Tin Marín',
  'BCP',
  'De Tin Marín SAC',
  '191-12345678-0-12',
  '00219100123456789012'
)
on conflict (singleton_key) do nothing;

alter table core.public_business_settings enable row level security;

create policy "public_business_settings_select_public"
  on core.public_business_settings for select
  using (true);

create policy "public_business_settings_update_staff"
  on core.public_business_settings for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger public_business_settings_set_updated_at
  before update on core.public_business_settings
  for each row execute function core.set_updated_at();

grant select on core.public_business_settings to anon, authenticated;
grant update on core.public_business_settings to authenticated;
