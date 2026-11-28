-- 「맞춤 알림」 데이터 구조 (2026.11.28 로드 방향)
--
-- ⚠️ 아직 운영에 적용하지 않았다. 운영 적용은 대표 확인 후.
--    적용 방법: Supabase 대시보드 → SQL Editor에 이 파일 전체를 붙여넣고 Run
--    (프로젝트 ssxxqiwlywcgmgkdgmtz). 두 번 돌려도 괜찮게 써뒀다.
--    적용 전에는 새 화면들이 "아직 준비 중이에요"라고 말할 뿐, 기존 화면은 그대로다.
--
-- 새로 만드는 것
--   1. programs에 대상 조건 칸  — 카드는 새로 만들지 않고 기존 표를 그대로 쓴다.
--                                 마감일(apply_deadline)·공식 링크(link)·확인한 날짜
--                                 (last_verified_at)·신청 방법(apply_method)은 이미 있다.
--   2. notices         — 올린 공문·공고 원문과 초안. 서버(service_role)만.
--   3. teachers        — 초대받은 선생님. 서버(service_role)만.
--   4. alert_settings  — 학생 본인의 맞춤 설정. 본인만(RLS).
--   5. 저장소 notice-files — 올린 PDF. 비공개.
--
-- 되돌리는 법:
--   drop table public.alert_settings, public.teachers, public.notices;
--   drop function public.stamp_alert_settings();
--   alter table public.programs
--     drop column target_grades, drop column target_regions, drop column target_interests,
--     drop column edu_benefit_priority, drop column needs_recommendation, drop column who_text;

-- ── 1. 카드의 대상 조건 ─────────────────────────────────────────────
-- target_grades가 비어 있으면(null) 「맞춤 알림」 대상이 아닌 카드다.
-- 기존 카드는 전부 null이라 이 파일을 적용해도 알림이 나가지 않는다.
alter table public.programs
  add column if not exists target_grades text[]
    check (target_grades is null or (
      cardinality(target_grades) > 0
      and target_grades <@ array['m1','m2','m3','h1','h2','h3']::text[]
    )),
  -- 빈 값(null) = 전국. 한 칸은 '경기' 또는 '경기 수원시' 모양.
  add column if not exists target_regions text[],
  -- 빈 값(null) = 카드의 category를 관심 분야로 본다.
  add column if not exists target_interests text[]
    check (target_interests is null or target_interests <@
      array['education','counseling','housing','living','career','culture','contest']::text[]),
  -- 교육급여를 받는 학생을 먼저 뽑는 기회인지. 제도의 성질이지 학생 정보가 아니다.
  -- 카드·목록에 라벨로 보여주지 않는다(절대규칙 1·2).
  add column if not exists edu_benefit_priority boolean not null default false,
  -- 선생님 같은 어른의 추천이 있어야 신청할 수 있는지.
  add column if not exists needs_recommendation boolean not null default false,
  -- "누가 신청할 수 있나"를 쉬운 말로. 상세 화면에서 기본으로 접어 둔다.
  add column if not exists who_text text;

-- ── 2. 올린 공문·공고 ───────────────────────────────────────────────
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 선생님이면 그 계정. 운영자(비밀번호 로그인)는 계정이 없어 비어 있다.
  created_by uuid references auth.users (id) on delete set null,
  uploader_role text not null check (uploader_role in ('operator', 'teacher')),
  source_text text check (source_text is null or char_length(source_text) <= 30000),
  file_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  -- 사람이 고치던 초안 / 게시한 순간의 내용
  draft jsonb,
  program_id text references public.programs (id) on delete set null,
  published_at timestamptz
);

comment on table public.notices is
  '「맞춤 알림」으로 올린 공문·공고 원문. 선생님 이름·연락처가 섞일 수 있어 서버(service_role)만 읽고 쓴다.';

create index if not exists notices_created_at_idx on public.notices (created_at desc);

alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select, insert, update on public.notices to service_role;

-- ── 3. 초대받은 선생님 ──────────────────────────────────────────────
-- user_profiles.role = 'adult'는 본인이 고르는 값이라 권한 근거가 못 된다.
-- 운영자가 초대한 계정만 여기 들어온다. 초대를 거둘 땐 지우지 않고 revoked_at을 채운다.
create table if not exists public.teachers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  login_id text not null,
  invited_at timestamptz not null default now(),
  revoked_at timestamptz
);

comment on table public.teachers is
  '운영자가 초대한 선생님 계정. 공문을 올려 카드를 게시할 수 있다. 서버(service_role)만.';

alter table public.teachers enable row level security;
revoke all on public.teachers from anon, authenticated;
grant select, insert, update on public.teachers to service_role;

-- ── 4. 학생 맞춤 설정 ───────────────────────────────────────────────
-- 본인만 읽고 쓴다. 선생님·기관·관리자 화면 어디에도 한 명씩 보여주지 않는다.
-- service_role은 알림 받을 사람을 서버에서 고를 때만 읽는다(쓰기 권한 없음).
-- edu_benefit(교육급여)은 선택 항목이다. 끄면 값과 동의 시각을 그 자리에서 지운다.
create table if not exists public.alert_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  grade text check (grade is null or grade in ('m1','m2','m3','h1','h2','h3')),
  sido text check (sido is null or char_length(sido) <= 10),
  sigungu text check (sigungu is null or char_length(sigungu) <= 20),
  interests text[] not null default '{}'
    check (interests <@
      array['education','counseling','housing','living','career','culture','contest']::text[]),
  edu_benefit boolean not null default false,
  edu_benefit_consented_at timestamptz,
  updated_at timestamptz not null default now(),
  check (edu_benefit = (edu_benefit_consented_at is not null))
);

comment on table public.alert_settings is
  '학생 본인의 맞춤 알림 설정. 본인만 읽는다. edu_benefit은 별도 선택 동의 — 알림에만 쓰고 누구에게도 보여주지 않는다.';

-- 동의 시각은 화면이 보낸 값을 믿지 않고 DB가 찍는다.
create or replace function public.stamp_alert_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if not new.edu_benefit then
    new.edu_benefit_consented_at := null;
  elsif tg_op = 'UPDATE' and old.edu_benefit then
    new.edu_benefit_consented_at := old.edu_benefit_consented_at;
  else
    new.edu_benefit_consented_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_alert_settings() from public, anon, authenticated;

drop trigger if exists trg_alert_settings_stamp on public.alert_settings;
create trigger trg_alert_settings_stamp
  before insert or update on public.alert_settings
  for each row execute function public.stamp_alert_settings();

alter table public.alert_settings enable row level security;
revoke all on public.alert_settings from anon, authenticated;
grant select, insert, update on public.alert_settings to authenticated;
grant select on public.alert_settings to service_role;

drop policy if exists "본인 설정만 읽기" on public.alert_settings;
create policy "본인 설정만 읽기" on public.alert_settings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "본인 설정만 만들기" on public.alert_settings;
create policy "본인 설정만 만들기" on public.alert_settings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "본인 설정만 고치기" on public.alert_settings;
create policy "본인 설정만 고치기" on public.alert_settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5. 올린 PDF 보관함 ──────────────────────────────────────────────
-- 비공개. 정책을 만들지 않으므로 서버(service_role)만 넣고 꺼낸다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notice-files', 'notice-files', false, 4194304, array['application/pdf'])
on conflict (id) do nothing;
