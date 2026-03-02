do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'honeycomb'
  ) then
    execute $sql$
      insert into public.profiles (id, honeycomb, email, updated_at)
      select u.id, 0, u.email, now()
      from auth.users u
      left join public.profiles p on p.id = u.id
      where p.id is null;
    $sql$;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'points'
  ) then
    execute $sql$
      insert into public.profiles (id, points, email, updated_at)
      select u.id, 0, u.email, now()
      from auth.users u
      left join public.profiles p on p.id = u.id
      where p.id is null;
    $sql$;
  else
    execute $sql$
      insert into public.profiles (id, email, updated_at)
      select u.id, u.email, now()
      from auth.users u
      left join public.profiles p on p.id = u.id
      where p.id is null;
    $sql$;
  end if;
end $$;

update public.profiles p
set email = u.email,
    updated_at = now()
from auth.users u
where u.id = p.id
  and (
    p.email is null
    or p.email = ''
    or lower(p.email) <> lower(u.email)
  );
