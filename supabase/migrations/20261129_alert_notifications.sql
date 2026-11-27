-- 「맞춤 알림」 알림함 (2026.11.28)
--
-- ⚠️ 아직 운영에 적용하지 않았다. 운영 적용은 대표 확인 후.
--    먼저 20261128_custom_alerts.sql을 적용한 다음, 이 파일 전체를
--    Supabase 대시보드 → SQL Editor에 붙여넣고 Run. 두 번 돌려도 괜찮다.
--    적용 전에는 알림함이 "아직 준비 중이에요"라고 말할 뿐, 다른 화면은 그대로다.
--
-- 담는 것: 어느 학생에게 어느 카드를 언제 알렸고 읽었는지. 문구는 저장하지 않는다
-- (제목은 늘 같고 본문은 카드 이름이라 화면에서 만든다). 교육급여 선택 여부도 없다.
--
-- 되돌리는 법: drop table public.alert_notifications;

create table if not exists public.alert_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null references public.programs (id) on delete cascade,
  -- new = 게시됐을 때, deadline = 마감 3일 전
  kind text not null check (kind in ('new', 'deadline')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  -- 같은 알림은 한 번만. 매일 도는 작업이 여러 번 돌아도 겹치지 않는다.
  unique (user_id, program_id, kind)
);

comment on table public.alert_notifications is
  '맞춤 알림 알림함. 본인만 읽고 읽음 표시만 할 수 있다. 만드는 건 서버(service_role)만.';

create index if not exists alert_notifications_program_idx on public.alert_notifications (program_id, kind);

alter table public.alert_notifications enable row level security;
revoke all on public.alert_notifications from anon, authenticated, service_role;
grant select on public.alert_notifications to authenticated;
grant update (read_at) on public.alert_notifications to authenticated;
grant select, insert on public.alert_notifications to service_role;

drop policy if exists "본인 알림만 읽기" on public.alert_notifications;
create policy "본인 알림만 읽기" on public.alert_notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "본인 알림만 읽음 표시" on public.alert_notifications;
create policy "본인 알림만 읽음 표시" on public.alert_notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
