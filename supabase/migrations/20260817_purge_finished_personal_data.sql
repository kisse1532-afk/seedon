-- 개인정보 보관기한 청소 (2026.08.17)
--
-- 화면과 약관이 "관심 등록과 도움 요청은 처리가 끝나고 1년까지요. 그다음엔
-- 지워요"라고 약속하는데(lib/policy.ts), 실제로 지우는 작업이 없었다.
-- 사업운영팀이 코드에서 삭제 작업을 못 찾아 지적했고 확인 결과 사실이었다.
-- pg_cron도, 함수도, 트리거도 하나도 없었다.
--
-- 이 파일은 Supabase에 apply_migration으로 넣은 것과 같은 내용이다.
-- (기록용 — 나중에 되돌리거나 다른 환경에 다시 올릴 때 쓴다)

alter table public.applications  add column if not exists completed_at timestamptz;
alter table public.help_requests add column if not exists completed_at timestamptz;

-- 상태가 'completed'가 되는 순간을 자동으로 찍는다. 사람이 따로 기록하게
-- 만들면 반드시 빠진다.
create or replace function public.stamp_completed_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_applications_completed_at on public.applications;
create trigger trg_applications_completed_at
  before update on public.applications
  for each row execute function public.stamp_completed_at();

drop trigger if exists trg_help_requests_completed_at on public.help_requests;
create trigger trg_help_requests_completed_at
  before update on public.help_requests
  for each row execute function public.stamp_completed_at();

-- 끝난 지 1년이 지난 것만 지운다. 아직 처리 중인 청소년의 요청은 건드리지 않는다.
create or replace function public.purge_finished_personal_data()
returns table(source text, removed bigint)
language plpgsql security definer set search_path = public as $$
declare a bigint; h bigint;
begin
  delete from public.applications
   where status='completed' and completed_at is not null
     and completed_at < now() - interval '1 year';
  get diagnostics a = row_count;

  delete from public.help_requests
   where status='completed' and completed_at is not null
     and completed_at < now() - interval '1 year';
  get diagnostics h = row_count;

  return query select 'applications', a union all select 'help_requests', h;
end;
$$;

revoke all on function public.purge_finished_personal_data() from public, anon, authenticated;
revoke all on function public.stamp_completed_at() from public, anon, authenticated;

-- 부르는 사람이 없으면 아무것도 안 지워진다. 지금까지가 그 상태였다.
create extension if not exists pg_cron with schema cron;
select cron.unschedule(jobid) from cron.job where jobname='purge-finished-personal-data';
select cron.schedule(
  'purge-finished-personal-data',
  '17 18 * * *',                    -- UTC 18:17 = 한국시간 새벽 3시 17분
  $$select public.purge_finished_personal_data()$$
);

-- ── 2026.08.20 추가 ───────────────────────────────────────────────
-- 사업운영팀 지적: 개인정보 안내가 "어떤 화면을 봤는지에 대한 기록은 1년까지요"
-- 라고 약속하는데, 위 청소 작업은 applications와 help_requests만 지운다.
-- program_events는 아무도 안 지우고 있었다. 어제 이 표에 user_id와 source가
-- 붙으면서 개인정보 성격이 더 커졌는데도 그대로였다.
--
-- 통계는 최근 30일만 보므로 1년 지난 것을 지워도 잃는 게 없다.
create or replace function public.purge_finished_personal_data()
returns table(source text, removed bigint)
language plpgsql security definer set search_path = public as $$
declare a bigint; h bigint; e bigint;
begin
  delete from public.applications
   where status='completed' and completed_at is not null
     and completed_at < now() - interval '1 year';
  get diagnostics a = row_count;

  delete from public.help_requests
   where status='completed' and completed_at is not null
     and completed_at < now() - interval '1 year';
  get diagnostics h = row_count;

  -- 화면을 본 기록. 처리 완료 개념이 없으니 남긴 날부터 1년으로 센다.
  delete from public.program_events
   where created_at < now() - interval '1 year';
  get diagnostics e = row_count;

  return query
    select 'applications', a union all
    select 'help_requests', h union all
    select 'program_events', e;
end;
$$;

revoke all on function public.purge_finished_personal_data() from public, anon, authenticated;
