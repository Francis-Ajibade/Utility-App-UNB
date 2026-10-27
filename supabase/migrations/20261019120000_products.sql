-- The materials the lab keeps and the barcodes printed on them.


-- Checks every table uses: is this person in the workspace, and are they an admin there?

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.team_members
        where team_members.team_id = p_team_id
          and team_members.user_id = auth.uid()
    );
$$;

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.team_members
        where team_members.team_id = p_team_id
          and team_members.user_id = auth.uid()
          and team_members.role = 'admin'
    );
$$;


-- Stops a row being moved to another workspace. Any table can use it.

create or replace function public.keep_team_id()
returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.team_id is distinct from old.team_id then
        raise exception 'Rows cannot move to another workspace';
    end if;
    return new;
end;
$$;


-- Products: one row per material (each size is its own product). Never deleted, only archived.

create table if not exists public.products (
    id             uuid primary key default gen_random_uuid(),
    team_id        uuid not null references public.teams (id) on delete cascade,
    name           text not null,
    category_code  text,
    items_per_box  integer not null check (items_per_box > 0),
    refill_below   integer not null check (refill_below >= 0),
    reorder_below  integer not null check (reorder_below >= 0),
    photo_path     text,
    archived_at    timestamptz,
    created_by     uuid default auth.uid() references auth.users (id) on delete set null,
    created_at     timestamptz not null default now(),

    unique (id, team_id)
);

create trigger products_keep_team_id
    before update on public.products
    for each row execute function public.keep_team_id();

-- No two products with the same name in a workspace, ignoring capitals.
create unique index if not exists products_team_name_key
    on public.products (team_id, lower(name));


-- Barcodes: the code on an item, box or case, linked to its product on the first scan.

create table if not exists public.barcodes (
    id              uuid primary key default gen_random_uuid(),
    team_id         uuid not null references public.teams (id) on delete cascade,
    product_id      uuid not null,
    code            text not null,
    tag             text not null check (tag in ('item', 'box', 'case')),
    items_per_scan  integer not null check (items_per_scan > 0),
    created_by      uuid default auth.uid() references auth.users (id) on delete set null,
    created_at      timestamptz not null default now(),

    -- A single item always counts as 1.
    check (tag <> 'item' or items_per_scan = 1),
    foreign key (product_id, team_id) references public.products (id, team_id),
    unique (team_id, code)
);


-- Everyone in the workspace sees products and barcodes. Admins add and edit products;
-- anyone can link a barcode, only admins change or remove one.

alter table public.products enable row level security;
alter table public.barcodes enable row level security;

create policy "Members can read their team's products"
    on public.products for select
    using (public.is_team_member(team_id));

create policy "Admins can add products"
    on public.products for insert
    with check (public.is_team_admin(team_id) and created_by = auth.uid());

create policy "Admins can update products"
    on public.products for update
    using (public.is_team_admin(team_id))
    with check (public.is_team_admin(team_id));

create policy "Members can read their team's barcodes"
    on public.barcodes for select
    using (public.is_team_member(team_id));

create policy "Members can add barcodes"
    on public.barcodes for insert
    with check (public.is_team_member(team_id) and created_by = auth.uid());

create policy "Admins can update barcodes"
    on public.barcodes for update
    using (public.is_team_admin(team_id))
    with check (public.is_team_admin(team_id));

create policy "Admins can delete barcodes"
    on public.barcodes for delete
    using (public.is_team_admin(team_id));
