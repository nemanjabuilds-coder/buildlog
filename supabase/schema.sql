-- BuildLog relational schema for Supabase. Run in the Supabase SQL Editor.
-- Authenticated data access is protected by RLS. Anonymous portfolios use only the scoped RPC below.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '',
  goals text not null default '',
  technology_tags text[] not null default '{}',
  status text not null default 'planning'
    check (status in ('planning', 'in_progress', 'completed', 'paused')),
  progress integer not null default 0 check (progress between 0 and 100),
  repository_url text,
  demo_url text,
  target_date date,
  is_public boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_id_owner_key unique (id, owner_id),
  constraint projects_public_slug_required check (not is_public or public_slug is not null)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  notes text not null default '',
  due_date date,
  is_complete boolean not null default false,
  is_public boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint milestones_project_owner_fk
    foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);

create table if not exists public.learning_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('work', 'challenge', 'takeaway')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  constraint learning_entries_project_owner_fk
    foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);

create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc);
create index if not exists projects_public_slug_idx
  on public.projects (public_slug) where is_public = true;
create index if not exists milestones_owner_project_order_idx
  on public.milestones (owner_id, project_id, sort_order, created_at);
create index if not exists learning_entries_owner_project_created_idx
  on public.learning_entries (owner_id, project_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.learning_entries enable row level security;

drop policy if exists "read owned or published projects" on public.projects;
drop policy if exists "read own projects" on public.projects;
create policy "read own projects"
  on public.projects for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "insert own projects" on public.projects;
create policy "insert own projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "update own projects" on public.projects;
create policy "update own projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "delete own projects" on public.projects;
create policy "delete own projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "read owned or public milestones" on public.milestones;
drop policy if exists "read own milestones" on public.milestones;
create policy "read own milestones"
  on public.milestones for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "insert own milestones" on public.milestones;
create policy "insert own milestones"
  on public.milestones for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "update own milestones" on public.milestones;
create policy "update own milestones"
  on public.milestones for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "delete own milestones" on public.milestones;
create policy "delete own milestones"
  on public.milestones for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "read owned or public learning entries" on public.learning_entries;
drop policy if exists "read own learning entries" on public.learning_entries;
create policy "read own learning entries"
  on public.learning_entries for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = learning_entries.project_id
        and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "insert own learning entries" on public.learning_entries;
create policy "insert own learning entries"
  on public.learning_entries for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = learning_entries.project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "update own learning entries" on public.learning_entries;
create policy "update own learning entries"
  on public.learning_entries for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = learning_entries.project_id and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists "delete own learning entries" on public.learning_entries;
create policy "delete own learning entries"
  on public.learning_entries for delete to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.get_public_portfolio(p_slug text)
returns json
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.json_build_object(
    'project', pg_catalog.json_build_object(
      'title', p.title,
      'description', p.description,
      'goals', p.goals,
      'technology_tags', p.technology_tags,
      'status', p.status,
      'progress', p.progress,
      'repository_url', p.repository_url,
      'demo_url', p.demo_url,
      'target_date', p.target_date,
      'created_at', p.created_at
    ),
    'milestones', coalesce(
      (
        select pg_catalog.json_agg(
          pg_catalog.json_build_object(
            'title', m.title,
            'notes', m.notes,
            'due_date', m.due_date,
            'is_complete', m.is_complete
          ) order by m.sort_order, m.created_at
        )
        from public.milestones m
        where m.project_id = p.id and m.is_public = true
      ),
      '[]'::json
    ),
    'entries', coalesce(
      (
        select pg_catalog.json_agg(
          pg_catalog.json_build_object(
            'kind', e.kind,
            'title', e.title,
            'body', e.body,
            'created_at', e.created_at
          ) order by e.created_at desc
        )
        from public.learning_entries e
        where e.project_id = p.id and e.visibility = 'public'
      ),
      '[]'::json
    )
  )
  from public.projects p
  where p.public_slug = p_slug and p.is_public = true;
$function$;

revoke select on public.projects, public.milestones, public.learning_entries from anon, public;
grant select, insert, update, delete
  on public.projects, public.milestones, public.learning_entries to authenticated;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;
