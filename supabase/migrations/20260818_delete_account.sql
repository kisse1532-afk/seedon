-- "계정을 통째로 지워드려요" 약속을 실제로 지키는 절차 (2026.08.18)
--
-- 화면 두 곳이 명시적으로 약속한다.
--   lib/policy.ts:115        "계정을 통째로 지우고 싶으면 아래 연락처로 알려주세요.
--                             저장한 프로그램, 동의 기록, 남긴 후기까지 같이 지워드려요."
--   app/mypage/MyInfo.tsx    같은 문장
-- 그런데 그 요청이 왔을 때 실행할 것이 코드에도 DB에도 없었다. 사업운영팀이
-- 지적했고 확인 결과 사실이었다.
--
-- 더 정확히는, Supabase 대시보드에서 계정(auth.users)을 지우는 것만으로는
-- 약속이 지켜지지 않는다. 외래키 설정이 이렇게 돼 있기 때문이다.
--
--   bookmarks.user_id       → CASCADE   지워짐 ✅ ("저장한 프로그램")
--   user_profiles.user_id   → CASCADE   지워짐 ✅ ("동의 기록")
--   program_reviews.user_id → SET NULL  ❌ 후기 본문과 닉네임이 그대로 남는다
--   applications.user_id    → SET NULL  ❌ 이름과 연락처가 그대로 남는다
--   program_events.user_id  → SET NULL  (개인정보 없음. 통계라서 남겨도 된다)
--
-- 즉 계정만 지우면 청소년의 이름·연락처·후기가 주인 없는 행으로 남는다.
-- 이 함수가 그 둘을 먼저 지운 뒤, 계정을 지우면 나머지는 CASCADE로 따라간다.

create or replace function public.delete_account(target uuid)
returns table(source text, removed bigint)
language plpgsql security definer set search_path = public as $$
declare a bigint; r bigint; b bigint; p bigint;
begin
  -- 이름·연락처가 든 것부터. 계정을 지워도 안 따라가는 것들이다.
  delete from public.applications    where user_id = target;
  get diagnostics a = row_count;

  delete from public.program_reviews where user_id = target;
  get diagnostics r = row_count;

  -- 계정을 지우면 CASCADE로 따라가지만, 계정 삭제 전에 확인용으로 세어 둔다.
  select count(*) into b from public.bookmarks     where user_id = target;
  select count(*) into p from public.user_profiles where user_id = target;

  -- program_events는 남긴다. user_id는 SET NULL로 끊기고, 남는 것은
  -- "어느 프로그램이 몇 번 열렸나"라는 익명 숫자뿐이다.

  return query
    select 'applications',        a union all
    select 'program_reviews',     r union all
    select 'bookmarks(대기)',     b union all
    select 'user_profiles(대기)', p;
end;
$$;

comment on function public.delete_account(uuid) is
  '계정 삭제 요청 처리 1단계. 이름·연락처·후기를 먼저 지운다. 그다음 Supabase 대시보드 Authentication에서 그 계정을 지우면 북마크·동의기록은 CASCADE로 따라간다. 절차는 docs/계정삭제-절차.md.';

-- 청소년 브라우저에서는 절대 부를 수 없어야 한다. 운영자가 SQL로만 부른다.
revoke all on function public.delete_account(uuid) from public, anon, authenticated;
