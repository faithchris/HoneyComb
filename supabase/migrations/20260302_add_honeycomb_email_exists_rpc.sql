create or replace function public.honeycomb_email_exists(email_input text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(email_input)
  );
$$;

revoke all on function public.honeycomb_email_exists(text) from public;
grant execute on function public.honeycomb_email_exists(text) to anon, authenticated;
