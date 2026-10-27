-- Stock: how much of each product is in each place. Stays at 0 when empty.
create table if not exists public.stock (
    id               uuid primary key default gen_random_uuid(),
    team_id          uuid not null references public.teams (id) on delete cascade,
    product_id       uuid not null,
    room             text not null,
    spot             text not null,
    bin              text,
    kind             text not null default 'working' check (kind in ('working', 'reserve')),
    unopened_boxes   integer not null default 0 check (unopened_boxes >= 0),
    items            integer not null default 0 check (items >= 0),  -- single items here, outside sealed boxes
    opened_at        timestamptz,
    opened_by        uuid references auth.users (id) on delete set null,
    last_counted_at  timestamptz,
    last_counted_by  uuid references auth.users (id) on delete set null,
    updated_at       timestamptz not null default now(),

    -- A place needs a real room and spot name, not a blank.
    check (room <> '' and spot <> '' and bin <> ''),
    foreign key (product_id, team_id) references public.products (id, team_id),
    unique (id, team_id),
    unique nulls not distinct (team_id, product_id, room, spot, bin)
);

create trigger stock_keep_team_id
    before update on public.stock
    for each row execute function public.keep_team_id();

-- Activity: the log of every change, never edited.
create table if not exists public.activity (
    id          uuid primary key default gen_random_uuid(),
    team_id     uuid not null references public.teams (id) on delete cascade,
    product_id  uuid not null,
    stock_id    uuid not null,
    type        text not null check (type in ('add', 'take', 'give_out', 'open_box',
                    'set_count', 'transfer', 'undo')),
    change      jsonb not null,
    source      text not null check (source in ('scan', 'card', 'assistant', 'form', 'import')),
    details     jsonb not null default '{}',
    user_id     uuid references auth.users (id) on delete set null,
    created_at  timestamptz not null default now(),

    foreign key (product_id, team_id) references public.products (id, team_id),
    foreign key (stock_id, team_id) references public.stock (id, team_id)
);

create index if not exists activity_team_time on public.activity (team_id, created_at desc);
create index if not exists activity_product_time on public.activity (product_id, created_at desc);
create index if not exists activity_stock_time on public.activity (stock_id, created_at desc);


-- Everyone in the workspace can read stock and the log. Only the functions below write.
alter table public.stock enable row level security;
alter table public.activity enable row level security;

create policy "Members can read their team's stock"
    on public.stock for select
    using (public.is_team_member(team_id));

create policy "Members can read their team's activity"
    on public.activity for select
    using (public.is_team_member(team_id));

-- Send stock and log changes live, so the dashboard updates without a reload.
alter publication supabase_realtime add table public.stock, public.activity;


-- Writes one log row. Staff can't call it directly.
create or replace function public.log_activity(
    p_team_id    uuid,
    p_product_id uuid,
    p_stock_id   uuid,
    p_type       text,
    p_change     jsonb,
    p_source     text,
    p_details    jsonb
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    new_id uuid;
begin
    insert into public.activity (team_id, product_id, stock_id, type, change, source, details, user_id)
    values (p_team_id, p_product_id, p_stock_id, p_type, p_change, p_source,
            coalesce(p_details, '{}'), auth.uid())
    returning activity.id into new_id;
    return new_id;
end;
$$;

revoke execute on function public.log_activity(uuid, uuid, uuid, text, jsonb, text, jsonb)
    from public, anon, authenticated;


-- The real work of adding stock. Only add_stock and transfer can use it, so
-- nobody can log a move that didn't happen.
create or replace function public.add_stock_internal(
    p_product_id uuid,
    p_room       text,
    p_spot       text,
    p_bin        text,
    p_boxes      integer,
    p_items      integer,
    p_type       text,
    p_source     text,
    p_details    jsonb,
    p_kind       text
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_product  public.products%rowtype;
    v_room     text := btrim(p_room);
    v_spot     text := btrim(p_spot);
    v_bin      text := nullif(btrim(p_bin), '');
    v_boxes    integer := coalesce(p_boxes, 0);
    v_items    integer := coalesce(p_items, 0);
    v_stock_id uuid;
begin
    select * into v_product from public.products where products.id = p_product_id;
    if not found then
        raise exception 'Product not found';
    end if;

    if not public.is_team_member(v_product.team_id) then
        raise exception 'Not a member of this workspace';
    end if;
    if v_product.archived_at is not null then
        raise exception 'This item is archived';
    end if;
    if coalesce(v_room, '') = '' or coalesce(v_spot, '') = '' then
        raise exception 'Room and spot are required';
    end if;
    if v_boxes < 0 or v_items < 0 then
        raise exception 'Amounts must be 0 or more';
    end if;
    if v_boxes = 0 and v_items = 0 then
        raise exception 'Add at least one box or item';
    end if;

    insert into public.stock (team_id, product_id, room, spot, bin, kind)
    values (v_product.team_id, p_product_id, v_room, v_spot, v_bin, p_kind)
    on conflict (team_id, product_id, room, spot, bin) do nothing;

    update public.stock
    set unopened_boxes = stock.unopened_boxes + v_boxes,
        items = stock.items + v_items,
        updated_at = now()
    where stock.team_id = v_product.team_id
      and stock.product_id = p_product_id
      and stock.room = v_room
      and stock.spot = v_spot
      and stock.bin is not distinct from v_bin
    returning stock.id into v_stock_id;

    return public.log_activity(v_product.team_id, p_product_id, v_stock_id, p_type,
        jsonb_build_object('unopened_boxes', v_boxes, 'items', v_items), p_source, p_details);
end;
$$;

revoke execute on function public.add_stock_internal(uuid, text, text, text, integer, integer, text, text, jsonb, text)
    from public, anon, authenticated;


-- Adds sealed boxes and/or single items. Creates the place if new.
create or replace function public.add_stock(
    p_product_id uuid,
    p_room       text,
    p_spot       text,
    p_bin        text,
    p_boxes      integer,
    p_items      integer,
    p_source     text default 'card',
    p_kind       text default 'working'
)
returns uuid
language plpgsql security definer set search_path = '' as $$
begin
    return public.add_stock_internal(p_product_id, p_room, p_spot, p_bin, p_boxes, p_items,
        'add', p_source, '{}', p_kind);
end;
$$;


-- The real work of taking stock. Only take_stock and transfer can use it.
-- Takes exactly what it's sent: sealed boxes and/or single items.
create or replace function public.take_stock_internal(
    p_stock_id  uuid,
    p_boxes     integer,
    p_items     integer,
    p_type      text,
    p_source    text,
    p_details   jsonb
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_stock public.stock%rowtype;
    v_boxes integer := coalesce(p_boxes, 0);
    v_items integer := coalesce(p_items, 0);
begin
    select * into v_stock from public.stock where stock.id = p_stock_id for update;
    if not found then
        raise exception 'Nothing stocked here';
    end if;

    if not public.is_team_member(v_stock.team_id) then
        raise exception 'Not a member of this workspace';
    end if;
    if p_type = 'give_out' and coalesce(btrim(p_details ->> 'given_to'), '') = '' then
        raise exception 'Say who it was given to';
    end if;
    if v_boxes < 0 or v_items < 0 then
        raise exception 'Amounts must be 0 or more';
    end if;
    if v_boxes = 0 and v_items = 0 then
        raise exception 'Take at least one box or item';
    end if;
    if v_boxes > v_stock.unopened_boxes then
        raise exception 'Not enough sealed boxes';
    end if;
    if v_items > v_stock.items then
        raise exception 'Not enough single items';
    end if;

    update public.stock
    set unopened_boxes = stock.unopened_boxes - v_boxes,
        items = stock.items - v_items,
        updated_at = now()
    where stock.id = p_stock_id;

    return public.log_activity(v_stock.team_id, v_stock.product_id, p_stock_id, p_type,
        jsonb_build_object('unopened_boxes', -v_boxes, 'items', -v_items),
        p_source, p_details);
end;
$$;

revoke execute on function public.take_stock_internal(uuid, integer, integer, text, text, jsonb)
    from public, anon, authenticated;


-- Takes stock out: used up ('take') or handed to a staff member ('give_out', with given_to).
-- Archived items can still be taken, so leftovers can be used up.
create or replace function public.take_stock(
    p_stock_id  uuid,
    p_boxes     integer,
    p_items     integer,
    p_type      text default 'take',
    p_source    text default 'card',
    p_details   jsonb default '{}'
)
returns uuid
language plpgsql security definer set search_path = '' as $$
begin
    if p_type not in ('take', 'give_out') then
        raise exception 'Unknown change';
    end if;
    return public.take_stock_internal(p_stock_id, p_boxes, p_items, p_type, p_source, p_details);
end;
$$;


-- Opens one sealed box (its items join the single items), only when the person taps "Open box".
create or replace function public.open_box(
    p_stock_id uuid,
    p_source   text default 'card'
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_stock   public.stock%rowtype;
    v_per_box integer;
begin
    select * into v_stock from public.stock where stock.id = p_stock_id for update;
    if not found then
        raise exception 'Nothing stocked here';
    end if;

    if not public.is_team_member(v_stock.team_id) then
        raise exception 'Not a member of this workspace';
    end if;
    if v_stock.unopened_boxes = 0 then
        raise exception 'No sealed boxes here';
    end if;

    select products.items_per_box into v_per_box
    from public.products where products.id = v_stock.product_id;

    update public.stock
    set unopened_boxes = stock.unopened_boxes - 1,
        items = stock.items + v_per_box,
        opened_at = now(),
        opened_by = auth.uid(),
        updated_at = now()
    where stock.id = p_stock_id;

    return public.log_activity(v_stock.team_id, v_stock.product_id, p_stock_id, 'open_box',
        jsonb_build_object('unopened_boxes', -1, 'items', v_per_box), p_source, '{}');
end;
$$;


-- Replaces the two numbers with a count. The app sends back the updated_at it read when
-- the count started; if the place has changed since, the count is refused.
create or replace function public.set_count(
    p_stock_id        uuid,
    p_unopened_boxes  integer,
    p_items           integer,
    p_seen_updated_at timestamptz,
    p_source          text default 'card'
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_stock public.stock%rowtype;
begin
    select * into v_stock from public.stock where stock.id = p_stock_id for update;
    if not found then
        raise exception 'Nothing stocked here';
    end if;

    if not public.is_team_member(v_stock.team_id) then
        raise exception 'Not a member of this workspace';
    end if;
    -- A blank here would wipe the stock, so both numbers are required.
    if p_unopened_boxes is null or p_items is null then
        raise exception 'Enter both numbers';
    end if;
    if p_unopened_boxes < 0 or p_items < 0 then
        raise exception 'Amounts must be 0 or more';
    end if;
    if p_seen_updated_at is null then
        raise exception 'Start the count again';
    end if;
    if v_stock.updated_at <> p_seen_updated_at then
        raise exception 'Stock changed while you were counting';
    end if;

    update public.stock
    set unopened_boxes = p_unopened_boxes,
        items = p_items,
        last_counted_at = now(),
        last_counted_by = auth.uid(),
        updated_at = now()
    where stock.id = p_stock_id;

    return public.log_activity(v_stock.team_id, v_stock.product_id, p_stock_id, 'set_count',
        jsonb_build_object('unopened_boxes', p_unopened_boxes - v_stock.unopened_boxes,
                           'items', p_items - v_stock.items),
        p_source, '{}');
end;
$$;


-- Moves stock to another place: an add there and a take here, in one go. Both log
-- rows share a transfer_id, so they show (and undo) as one move. p_to_kind is only
-- used when the destination is a new place.
create or replace function public.transfer(
    p_from_stock_id  uuid,
    p_to_room        text,
    p_to_spot        text,
    p_to_bin         text,
    p_boxes          integer,
    p_items          integer,
    p_source         text default 'card',
    p_to_kind        text default 'working'
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_from        public.stock%rowtype;
    v_to_room     text := btrim(p_to_room);
    v_to_spot     text := btrim(p_to_spot);
    v_to_bin      text := nullif(btrim(p_to_bin), '');
    v_transfer_id uuid := gen_random_uuid();
    v_add_id      uuid;
    v_to_stock_id uuid;
begin
    select * into v_from from public.stock where stock.id = p_from_stock_id;
    if not found then
        raise exception 'Nothing stocked here';
    end if;

    if v_from.room = v_to_room and v_from.spot = v_to_spot
       and v_from.bin is not distinct from v_to_bin then
        raise exception 'Pick a different place';
    end if;

    v_add_id := public.add_stock_internal(v_from.product_id, v_to_room, v_to_spot, v_to_bin,
        p_boxes, p_items, 'transfer', p_source,
        jsonb_build_object('from', p_from_stock_id, 'transfer_id', v_transfer_id), p_to_kind);

    select activity.stock_id into v_to_stock_id
    from public.activity where activity.id = v_add_id;

    return public.take_stock_internal(p_from_stock_id, p_boxes, p_items, 'transfer', p_source,
        jsonb_build_object('to', v_to_stock_id, 'transfer_id', v_transfer_id));
end;
$$;
