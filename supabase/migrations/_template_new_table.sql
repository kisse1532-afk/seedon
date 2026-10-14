-- 견본: 새 표를 만드는 마이그레이션 (실행용 아님 — 복사해서 이름을 바꿔 쓴다)
--
-- 왜 필요한가: Supabase가 2026.10.30부터 public 스키마의 새 표에
-- 화면 접근 권한(grant)을 자동으로 주지 않는다. 같은 파일에 grant를 안 적으면
-- 화면에서 그 표를 읽을 때 "permission denied"가 난다. (CLAUDE.md 「새 표를 만들 때」)
--
-- 파일명에 밑줄(_)로 시작하는 이 견본은 적용 대상이 아니다.

create table if not exists public.example_table (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- 1) 행 단위 보호를 먼저 켠다. 정책이 없으면 아무도 못 읽는다.
alter table public.example_table enable row level security;

-- 2) 누가 이 표에 손댈 수 있는지 적는다. 필요 없는 줄은 지운다.
--    anon          = 로그인 안 한 방문자 (공개 데이터만. 개인정보 표에는 주지 않는다)
--    authenticated = 로그인한 사람 (RLS 정책으로 본인 것만 보이게 한다)
--    service_role  = 서버 전용 키 (관리자 화면·점검 스크립트)
grant select on public.example_table to anon;
grant select, insert, update, delete on public.example_table to authenticated;
grant select, insert, update, delete on public.example_table to service_role;

-- 3) 정책 예시 — 로그인한 사람이 자기 행만 읽기 (user_id 칸이 있을 때)
-- create policy "본인 것만 읽기" on public.example_table
--   for select to authenticated using (auth.uid() = user_id);
