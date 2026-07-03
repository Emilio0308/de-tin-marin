-- Local seed (optional) — run after `supabase db reset`
-- Staff users should be created via Supabase Auth dashboard or signup flow in S1+

insert into core.settings (key, value)
values ('app.currency', '"PEN"')
on conflict (key) do nothing;
