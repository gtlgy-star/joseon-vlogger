create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_project_id uuid not null,
  grade integer not null default 5 check (grade between 1 and 6),
  class_number integer not null check (class_number between 1 and 7),
  group_number integer,
  display_name text not null default '',
  title text not null default '',
  social_status text not null default '',
  thumbnail text not null default '',
  snapshot jsonb not null,
  diary_shared boolean not null default true,
  storyboard_shared boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_project_id)
);

alter table public.projects enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

drop policy if exists "공유 작품 읽기" on public.projects;
create policy "공유 작품 읽기" on public.projects for select to authenticated
  using (
    owner_id = auth.uid()
    or diary_shared = true
    or storyboard_shared = true
  );

drop policy if exists "내 작품 등록" on public.projects;
create policy "내 작품 등록" on public.projects for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "내 작품 수정" on public.projects;
create policy "내 작품 수정" on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "내 작품 삭제" on public.projects;
create policy "내 작품 삭제" on public.projects for delete to authenticated
  using (owner_id = auth.uid());

create index if not exists projects_class_updated_idx on public.projects (class_number, updated_at desc);

create table if not exists public.project_confirms (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_confirms enable row level security;

revoke all on table public.project_confirms from anon;
grant select, insert, delete on table public.project_confirms to authenticated;

drop policy if exists "작품 확인 읽기" on public.project_confirms;
drop policy if exists "작품 추천 읽기" on public.project_confirms;
create policy "작품 추천 읽기" on public.project_confirms for select to authenticated
  using (true);

drop policy if exists "작품 확인 추가" on public.project_confirms;
drop policy if exists "작품 추천 추가" on public.project_confirms;
create policy "작품 추천 추가" on public.project_confirms for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects
      where projects.id = project_confirms.project_id
        and (projects.diary_shared = true or projects.storyboard_shared = true)
    )
  );

drop policy if exists "작품 확인 취소" on public.project_confirms;
drop policy if exists "작품 추천 취소" on public.project_confirms;
create policy "작품 추천 취소" on public.project_confirms for delete to authenticated
  using (user_id = (select auth.uid()));

create index if not exists project_confirms_project_idx on public.project_confirms (project_id);
