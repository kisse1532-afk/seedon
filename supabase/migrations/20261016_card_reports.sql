-- 카드마다 「정보가 틀렸어요」 신고 (인계함 2026.10.16 [결정] 제품 과업 6)
--
-- ⚠️ 아직 적용하지 않았다. 로드 확인 뒤 적용한다. 적용 전에는 버튼을 눌러도
--    "지금은 저장이 안 되네요"가 뜨고 아무것도 쌓이지 않는다(화면은 안 깨진다).
--
-- 왜 새 표인가: 기존 reports 표는 "새 지원 제도를 알려주세요" 제보함이라
-- 어느 카드인지(program_id)를 담는 칸이 없다. 섞으면 콘텐츠팀이 매일 점검 때
-- "어느 카드를 고쳐야 하나"를 바로 못 찾는다.
--
-- 개인정보: 받지 않는다. 누가 눌렀는지(user_id)도 남기지 않는다.
--          메모 칸에는 "이름·연락처는 적지 마세요"라고 화면에서 안내한다.

create table if not exists public.card_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  program_id text not null,
  reason text not null check (reason in ('deadline', 'link', 'content', 'phone', 'other')),
  note text check (note is null or char_length(note) <= 300),
  -- 콘텐츠팀이 처리했는지. new → fixed(고침) / unverified(확인 못 함) / dismissed(맞는 정보였음)
  status text not null default 'new' check (status in ('new', 'fixed', 'unverified', 'dismissed')),
  handled_note text
);

comment on table public.card_reports is
  '카드별 「정보가 틀렸어요」 신고. 개인정보 없음. 방문자는 넣기만, 읽기·처리는 service_role(서버)로만.';

create index if not exists card_reports_status_idx on public.card_reports (status, created_at desc);

-- 1) 행 단위 보호
alter table public.card_reports enable row level security;

-- 2) 권한 (2026.10.30부터 새 표는 자동으로 안 준다 — CLAUDE.md 「새 표를 만들 때」)
--    방문자·로그인한 사람: 넣기만. 읽기는 주지 않는다(다른 사람 신고를 볼 이유가 없다)
grant insert on public.card_reports to anon;
grant insert on public.card_reports to authenticated;
grant select, insert, update, delete on public.card_reports to service_role;

-- 3) 정책 — 새 신고만 넣을 수 있다(처리 상태를 바깥에서 바꿔 넣지 못하게)
create policy "누구나 신고 넣기" on public.card_reports
  for insert to anon, authenticated
  with check (status = 'new' and handled_note is null);
