-- 집계에서 "우리"를 빼는 장치 (2026.08.19)
--
-- 로드: "나는 로그인을 하고 카드를 누를께. 내 아이디는 집계에 포함하지 않는
--        거를 할 수 있나?"
--
-- 할 수 있다. 다만 빼야 할 게 둘이다.
--
--   ① 로드가 누른 것        → 로그인하면 user_id가 찍히므로 그 계정을 표시해두고 뺀다
--   ② 우리 점검 도구가 만든 것 → 로그인을 안 하니 user_id가 비어 있어서 못 가린다.
--                              그래서 "어디서 눌렸나"를 같이 남긴다
--
-- ②가 실제로 문제였다. `scripts/shot.mjs`는 진짜 크롬을 띄워 화면을 찍는데,
-- 그때 자바스크립트가 돌면서 기록이 남는다. 로컬(localhost)에서 찍어도
-- 바라보는 데이터베이스는 실서비스와 같은 곳이라 집계에 섞인다.
--
-- 8월 16일에도 같은 종류의 사고가 있었다 — 검색봇과 카톡 미리보기까지
-- "청소년이 봤다"로 세어져 96건을 통째로 버렸다.

-- ── ① 내부 사람 표시 ────────────────────────────────────────────
-- role 칸은 이미 "청소년 본인 / 곁에 있는 어른"으로 쓰고 있어 재사용하지 않는다.
alter table public.user_profiles
  add column if not exists is_internal boolean not null default false;

comment on column public.user_profiles.is_internal is
  '씨드온 운영자 계정. 집계에서 뺀다. 켜는 법은 docs/집계에서-빼기.md';

-- ── ② 이벤트가 어디서 왔나 ──────────────────────────────────────
alter table public.program_events
  add column if not exists source text not null default 'web';

comment on column public.program_events.source is
  'web = 실제 사이트 / internal = 우리 점검 도구나 로컬 개발. 집계는 web만 센다.';

-- 지금까지 쌓인 7건은 출처를 알 수 없다. 'unknown'으로 표시해 집계에서 뺀다.
-- 추측해서 세는 것보다 안 세는 게 낫다.
update public.program_events set source = 'unknown' where created_at < now();

-- ── 집계용 뷰 — 여기를 세면 우리가 자동으로 빠진다 ───────────────
create or replace view public.program_events_counted as
select e.*
  from public.program_events e
  left join public.user_profiles p on p.user_id = e.user_id
 where e.source = 'web'
   and coalesce(p.is_internal, false) = false;

comment on view public.program_events_counted is
  '집계에 쓸 이벤트만. 우리 점검 도구(source<>web)와 운영자 계정(is_internal)을 뺀 것.';

-- 이 뷰는 개인정보(누가 무엇을 봤나)라 서버 전용 키로만 읽는다.
revoke all on public.program_events_counted from anon, authenticated;
