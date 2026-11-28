-- 올린 공문 원본은 30일만 보관한다 (2026.11.29 대표 결정)
--
-- ⚠️ 아직 운영에 적용하지 않았다. 운영 적용은 대표 확인 후.
--    20261128_custom_alerts.sql을 먼저 적용한 다음 이 파일을 돌린다.
--    두 번 돌려도 괜찮다. 이 파일을 안 돌리면 「게시」와 삭제 작업이 실패한다.
--
-- 행은 지우지 않는다. 원본(source_text, draft, 저장소의 PDF)만 비우고 언제
-- 비웠는지 남긴다. 누가·언제 올렸는지, 상태, 만든 카드 연결은 그대로다.
-- 비우는 일은 서버 작업(/api/cron/purge-notices)이 한다 — 저장소 파일은 SQL이
-- 아니라 Supabase Storage API로 지워야 해서 DB 예약 작업으로는 할 수 없다.
--
-- 권한: notices의 기존 grant(service_role)가 새 칸에도 적용된다.
-- 되돌리는 법: alter table public.notices drop column source_purged_at;

alter table public.notices
  add column if not exists source_purged_at timestamptz;

comment on column public.notices.source_purged_at is
  '원문 글·초안·PDF를 비운 시각. 게시한 것은 게시 후 30일, 게시 안 한 것은 올린 후 30일.';
