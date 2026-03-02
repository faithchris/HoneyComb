do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'points'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'honeycomb'
  ) then
    alter table public.profiles rename column points to honeycomb;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'points_earned'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'honeycomb_earned'
  ) then
    alter table public.sessions rename column points_earned to honeycomb_earned;
  end if;
end $$;

alter table public.profiles
alter column honeycomb set default 0;

update public.profiles
set honeycomb = 0
where honeycomb is null;

alter table public.profiles
alter column honeycomb set not null;
