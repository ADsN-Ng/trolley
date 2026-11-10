-- Trolley: shared grocery lists
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.

create extension if not exists "pgcrypto";

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invite_token text not null unique default encode(gen_random_bytes(16), 'hex')
);

create table if not exists public.list_members (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('owner', 'member')) default 'member',
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  quantity text not null default '1',
  note text not null default '',
  category text not null default 'Other',
  checked boolean not null default false,
  added_by uuid not null references auth.users (id) on delete cascade,
  added_by_name text not null,
  checked_by uuid references auth.users (id) on delete set null,
  checked_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_list_id_idx on public.items (list_id);
create index if not exists items_list_id_checked_idx on public.items (list_id, checked);
create index if not exists list_members_user_id_idx on public.list_members (user_id);
create index if not exists lists_invite_token_idx on public.lists (invite_token);

alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.items enable row level security;

create or replace function public.is_list_member(target_list uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.list_members m
    where m.list_id = target_list
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_list_owner(target_list uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.list_members m
    where m.list_id = target_list
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- Join by invite: validates token and upserts membership in one call.
create or replace function public.join_list_by_invite(
  p_list_id uuid,
  p_token text,
  p_email text,
  p_display_name text
)
returns public.lists
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.lists;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into result
  from public.lists
  where id = p_list_id
    and invite_token = p_token;

  if result.id is null then
    raise exception 'Invite link is invalid or expired';
  end if;

  insert into public.list_members (list_id, user_id, email, display_name, role)
  values (p_list_id, auth.uid(), p_email, p_display_name, 'member')
  on conflict (list_id, user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name;

  update public.lists
  set updated_at = now()
  where id = p_list_id;

  return result;
end;
$$;

revoke all on function public.join_list_by_invite(uuid, text, text, text) from public;
grant execute on function public.join_list_by_invite(uuid, text, text, text) to authenticated;

-- Lists policies
create policy "Members can read lists"
  on public.lists for select
  to authenticated
  using (public.is_list_member(id));

create policy "Creators can read lists they just created"
  on public.lists for select
  to authenticated
  using (created_by = auth.uid());

create policy "Authenticated users can create lists"
  on public.lists for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Members can update lists"
  on public.lists for update
  to authenticated
  using (public.is_list_member(id))
  with check (public.is_list_member(id));

create policy "Owners can delete lists"
  on public.lists for delete
  to authenticated
  using (public.is_list_owner(id));

-- Members policies
create policy "Members can read members"
  on public.list_members for select
  to authenticated
  using (public.is_list_member(list_id));

create policy "Users can add themselves as members"
  on public.list_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners or self can remove members"
  on public.list_members for delete
  to authenticated
  using (public.is_list_owner(list_id) or user_id = auth.uid());

-- Items policies
create policy "Members can read items"
  on public.items for select
  to authenticated
  using (public.is_list_member(list_id));

create policy "Members can add items"
  on public.items for insert
  to authenticated
  with check (public.is_list_member(list_id) and added_by = auth.uid());

create policy "Members can update items"
  on public.items for update
  to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

create policy "Members can delete items"
  on public.items for delete
  to authenticated
  using (public.is_list_member(list_id));

-- Realtime
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_members;
