-- 2026.10.24 — 광고 랜딩페이지 기록을 따로 담는 표 landing_events
--
-- 왜 따로 만드나 (2026.10.24 로드 결정)
-- "씨드온이긴 해도 따로 관리를 해야지." 인스타 광고 실험(프리토타입 2회차, 가짜 문)의
-- 숫자는 서비스 본체의 숫자(카드 열기·신청 버튼, program_events)와 성격이 다르다.
-- 같은 표에 섞으면 관리자 화면 숫자와 파일럿 지표가 흐려지고, 실험이 끝난 뒤
-- 통째로 정리하기도 어렵다. 그래서 기존 표·뷰는 건드리지 않고 새 표에만 쌓는다.
--
-- 무엇을 남기나 (개인정보 없음 — 이름·연락처·로그인 계정 모두 안 남긴다)
--   event_type  start_view            /start를 연 것 (탭을 닫을 때까지 한 번)
--               start_fakedoor_click  「신청까지 한 번에 해 보기」를 누른 것
--               start_notify_click    "아직 만들고 있어요" 창에서 「열리면 제일 먼저 알림 받기」를 누른 것
--               start_sheet_close     그 창을 그냥 닫은 것
--   ref         주소의 ?from= 값 (insta_ad, insta_post, test …)
--   variant     주소의 ?v= 값 (광고 문구 A·B)
--   source      web = 진짜 주소(seedon.vercel.app) / internal = 로컬·PR 미리보기에서 누른 것
--   page        어느 랜딩페이지인지 (지금은 start 하나)
--
-- 권한: 방문자(anon)는 넣기만 한다. 읽기는 서버 키(service_role)만.
--       (CLAUDE.md 「새 표를 만들 때」 — 2026.10.30부터 grant를 같은 파일에 적는다)
--
-- 되돌리는 법: drop table public.landing_events;

create table if not exists public.landing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page text not null default 'start',
  event_type text not null check (event_type in (
    'start_view', 'start_fakedoor_click', 'start_notify_click', 'start_sheet_close'
  )),
  ref text check (ref is null or ref ~ '^[A-Za-z0-9_-]{1,32}$'),
  variant text check (variant is null or variant ~ '^[A-Za-z0-9_-]{1,32}$'),
  source text not null default 'web' check (source in ('web', 'internal'))
);

comment on table public.landing_events is
  '광고 랜딩페이지(/start) 단계별 기록. 서비스 본체 숫자(program_events)와 따로 관리한다. 개인정보 없음.';

create index if not exists landing_events_created_at_idx on public.landing_events (created_at);

-- 1) 행 단위 보호
alter table public.landing_events enable row level security;

-- 2) 권한 — 넣기는 누구나, 읽기는 서버 키만
revoke all on public.landing_events from anon, authenticated;
grant insert on public.landing_events to anon, authenticated;
grant select, insert, update, delete on public.landing_events to service_role;

-- 3) 정책 — 방문자는 랜딩 기록만 넣을 수 있다(읽기 정책 없음 = 못 읽음)
create policy "anyone can insert landing event"
  on public.landing_events for insert
  to anon, authenticated
  with check (page = 'start');
