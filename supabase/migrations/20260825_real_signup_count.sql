-- 2026.08.25 — 진짜 가입자 수를 기계가 세게 한다
--
-- 무엇이 문제였나
-- 자동 조임 규칙(가입자 1명 → 검증을 당일로, 10명 → 전 관점 되돌림)은
-- **사람이 매일 눈으로 세는 것**에만 걸려 있었다. 도구는 가입자 수를 아예
-- 계산하지 않았다. 그래서 어제 만든 화면 촬영용 계정이 오늘 아침 "가입자 1명"으로
-- 잡혀서, 아무도 안 왔는데 조임이 걸릴 뻔했다.
-- 절차에 "운영자는 빼고 세라"고 적어뒀지만, **사람이 기억해야 하는 규칙은
-- 언젠가 잊힌다.** 기계가 세게 한다. (운영 관점이 2026.08.25에 지적)
--
-- 왜 함수인가
-- 도구는 공개용 키로 도는데 그 키로는 계정 표를 못 읽는다(그래야 맞다).
-- 그래서 **숫자 하나만 돌려주는 함수**를 만든다. 이름·메일은 안 나간다.
--
-- 되돌리는 법: drop function public.real_signup_count();

create or replace function public.real_signup_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
    from auth.users u
   where not exists (
     select 1 from public.internal_emails ie
      where lower(ie.email) = lower(u.email)
   );
$$;

comment on function public.real_signup_count() is
  '운영자 계정을 뺀 진짜 가입자 수. 자동 조임 규칙이 이 숫자로 걸린다. 숫자만 돌려주므로 개인정보가 나가지 않는다.';

revoke all on function public.real_signup_count() from public;
grant execute on function public.real_signup_count() to anon, authenticated;
