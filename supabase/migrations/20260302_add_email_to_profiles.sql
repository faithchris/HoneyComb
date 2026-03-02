alter table public.profiles
add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;
