-- 2026.08.24 — 프로필이 없어도 집계에서 빠지게 한다
--
-- 무엇이 잘못돼 있었나
-- 집계 제외는 `user_profiles.is_internal`로만 걸려 있었다. 그런데 그 표시는
-- **프로필이 만들어질 때** 붙는다(가입 절차를 끝까지 밟아야 생긴다).
-- 오늘 만든 촬영용 계정은 가입만 하고 프로필을 안 만들어서 표시가 안 붙었다.
-- 지금은 다른 장치(어느 주소에서 열렸나)가 대신 막아주고 있어서 새어나가지
-- 않지만, 그건 우연이다 — 촬영 도구를 실제 주소로 돌리는 순간 집계에 섞인다.
-- 로드 계정도 마찬가지다. 가입만 하고 프로필을 안 만들면 안 빠진다.
--
-- 그래서 메일 주소 목록으로도 직접 거른다. 프로필이 있든 없든 걸린다.
--
-- 되돌리는 법: 아래 view 정의에서 `and not exists (...)` 절만 지우면 된다.

create or replace view public.program_events_counted as
  select e.id, e.event_type, e.program_id, e.category, e.created_at, e.user_id, e.source
    from program_events e
    left join user_profiles p on p.user_id = e.user_id
   where e.source = 'web'
     and coalesce(p.is_internal, false) = false
     -- 프로필이 없어도 메일 주소가 운영자 목록에 있으면 뺀다
     and not exists (
       select 1
         from auth.users u
         join public.internal_emails ie on lower(ie.email) = lower(u.email)
        where u.id = e.user_id
     );
