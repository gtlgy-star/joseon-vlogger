-- 기존 작품 데이터는 유지하고 작품 추천 저장소만 추가하는 안전한 보완 스크립트입니다.
-- Supabase SQL Editor에서 한 번 실행하세요.

begin;

create table if not exists public.project_confirms (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

comment on table public.project_confirms is
  '작품별 추천 기록. 기존 확인 기능의 테이블명을 호환성을 위해 유지한다.';
comment on column public.project_confirms.project_id is '추천받은 작품 ID';
comment on column public.project_confirms.user_id is '추천한 익명 또는 일반 인증 사용자 ID';

alter table public.project_confirms enable row level security;

grant usage on schema public to authenticated;
revoke all on table public.project_confirms from anon;
grant select, insert, delete on table public.project_confirms to authenticated;

-- 이전 정책명이 존재해도 데이터는 건드리지 않고 정책만 최신 규칙으로 교체합니다.
drop policy if exists "작품 확인 읽기" on public.project_confirms;
drop policy if exists "작품 확인 추가" on public.project_confirms;
drop policy if exists "작품 확인 취소" on public.project_confirms;
drop policy if exists "작품 추천 읽기" on public.project_confirms;
drop policy if exists "작품 추천 추가" on public.project_confirms;
drop policy if exists "작품 추천 취소" on public.project_confirms;

create policy "작품 추천 읽기" on public.project_confirms
  for select to authenticated
  using (true);

create policy "작품 추천 추가" on public.project_confirms
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.projects
      where projects.id = project_confirms.project_id
        and (projects.diary_shared = true or projects.storyboard_shared = true)
    )
  );

create policy "작품 추천 취소" on public.project_confirms
  for delete to authenticated
  using (user_id = (select auth.uid()));

create index if not exists project_confirms_project_idx
  on public.project_confirms (project_id);

commit;

-- PostgREST가 새 테이블을 즉시 다시 읽도록 요청합니다.
notify pgrst, 'reload schema';
