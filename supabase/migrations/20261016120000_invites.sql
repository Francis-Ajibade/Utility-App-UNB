-- Shareable invite links. One active link per team; anyone signed in with
-- @unb.ca who opens it joins as a member. Only the hash of the token is stored.

create table if not exists public.team_invites (
    id          uuid primary key default gen_random_uuid(),
    team_id     uuid not null references public.teams (id) on delete cascade,
    token_hash  text not null unique,
    created_by  uuid references auth.users (id) on delete set null,
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null default now() + interval '7 days',
    revoked_at  timestamptz
);

-- RLS on with no policies: nobody reads or writes this table directly.
-- Only the two functions below (security definer) touch it.
alter table public.team_invites enable row level security;


create or replace function public.create_invite_link(p_team_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
    new_token text;
    new_expires_at timestamptz;
begin
    if not exists (
        select 1 from public.team_members
        where team_members.team_id = p_team_id
          and team_members.user_id = auth.uid()
          and team_members.role = 'admin'
    ) then
        raise exception 'Only admins can invite';
    end if;

    update public.team_invites
    set revoked_at = now()
    where team_invites.team_id = p_team_id and team_invites.revoked_at is null;

    new_token := encode(extensions.gen_random_bytes(24), 'hex');

    insert into public.team_invites (team_id, token_hash, created_by)
    values (p_team_id, encode(extensions.digest(new_token, 'sha256'), 'hex'), auth.uid())
    returning team_invites.expires_at into new_expires_at;

    return query select new_token, new_expires_at;
end;
$$;


create or replace function public.join_team(p_token text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    invite public.team_invites;
begin
    if auth.uid() is null then
        raise exception 'Not signed in';
    end if;

    select * into invite from public.team_invites
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

    if not found then
        raise exception 'Invite not found';
    end if;

    if invite.revoked_at is not null or invite.expires_at < now() then
        raise exception 'This invite has expired';
    end if;

    insert into public.team_members (team_id, user_id, role)
    values (invite.team_id, auth.uid(), 'member')
    on conflict do nothing;

    return invite.team_id;
end;
$$;
