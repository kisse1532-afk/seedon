-- 로드가 가입하는 순간 자동으로 집계에서 빠지게 (2026.08.19, 08.20 보강)
--
-- ⚠️ 이 파일은 뒤늦게 남긴다. 2026.08.19에 이 내용을 DB에 바로 넣고
-- 저장소에 파일로 남기지 않았다. 사업운영팀이 다음 날 "약속하는 장치가
-- 저장소 어디에도 없다"고 잡아냈다 — 맞는 지적이다. DB와 저장소가 다르면
-- 되돌릴 수도, 다른 환경에 다시 올릴 수도, 아무도 검증할 수도 없다.
--
-- 로드: "니가 내 아이디랑 비번 만들어 주면 되잖아 ㅋㅋㅋ"
-- 그건 안 하는 게 맞다. 비밀번호를 에이전트가 알게 되고, 그걸 대화로
-- 주고받는 건 2026.08.15에 실제로 키가 노출됐던 그 방식이다.
-- 대신 가입만 하시면 손댈 것 없이 자동으로 빠지게 해둔다.

create table if not exists public.internal_emails (
  email text primary key,
  note  text,
  added_at timestamptz not null default now()
);

comment on table public.internal_emails is
  '이 메일로 가입하면 집계에서 자동으로 빠진다. 씨드온 운영자 계정 목록.';

-- 정책을 하나도 두지 않는다 = 아무도 못 읽는다. 서버 전용 키로만 접근.
alter table public.internal_emails enable row level security;
revoke all on public.internal_emails from anon, authenticated;

insert into public.internal_emails (email, note) values
  ('kisse1532@dankook.ac.kr', '로드')
on conflict (email) do nothing;

create or replace function public.mark_internal_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1
      from auth.users u
      join public.internal_emails ie on lower(ie.email) = lower(u.email)
     where u.id = new.user_id
  ) then
    new.is_internal := true;
  end if;
  return new;
end;
$$;

/* insert만 잡으면 안 된다 — 프로필은 앱이 upsert로 만든다(lib/consent.ts).
   지금 코드로는 첫 쓰기가 항상 INSERT라 실제로는 걸리지만, 나중에 순서가
   바뀌면 조용히 새어 나간다. 2026.08.20 사업운영팀 지적으로 update도 잡는다. */
drop trigger if exists trg_mark_internal on public.user_profiles;
create trigger trg_mark_internal
  before insert or update on public.user_profiles
  for each row execute function public.mark_internal_on_profile();

revoke all on function public.mark_internal_on_profile() from public, anon, authenticated;

-- 이미 가입한 사람이 목록에 있으면 지금 켠다.
update public.user_profiles p set is_internal = true
  from auth.users u
  join public.internal_emails ie on lower(ie.email) = lower(u.email)
 where p.user_id = u.id and p.is_internal = false;
