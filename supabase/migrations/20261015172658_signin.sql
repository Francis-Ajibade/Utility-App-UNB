-- Only @unb.ca emails can sign up. Raising here cancels the whole sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if lower(new.email) not like '%@unb.ca' then
    raise exception 'Use your @unb.ca email';
  end if;

  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;

  return new;
end;
$$;


create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile row"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Only display_name can be updated, never email
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;


create policy "Users can read their own team memberships"
  on public.team_members for select
  using (auth.uid() = user_id);

create policy "Users can read teams they are a member of"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );


-- Creates the team and makes the caller its first admin
create or replace function public.create_team(p_name text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into public.teams (name, created_by)
  values (p_name, auth.uid())
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'admin');

  return new_team_id;
end;
$$;
