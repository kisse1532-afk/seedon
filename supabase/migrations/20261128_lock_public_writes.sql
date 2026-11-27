-- 보안: 공개 키로 데이터 바꾸는 길 막기 (2026.11.28)
--
-- ⚠️ 아직 적용하지 않았다. 운영 적용은 대표 확인 후.
-- ⚠️ 순서: 새 코드가 배포된 **다음에** 적용한다. 먼저 적용하면 관리자 화면의
--    저장·삭제가 안 된다. (#106 머지 → 환경변수 → 이 PR 머지·배포 → 이 파일)
--
-- 관리자만 해야 하는 쓰기가 공개 키로도 열려 있었다. 관리자 화면은 이제 서버 전용
-- 키(service_role)로 읽고 쓰므로, 아래 정책은 더 필요 없다. service_role은 RLS를
-- 거치지 않아서 따로 정책을 만들지 않는다.
--
-- 남기는 것 (손대지 않음)
--   programs        "public read published programs"   — 게시된 카드 읽기
--   community_posts "community_posts_select_published" — 게시된 글 읽기
--   reports         아래에서 새로 만드는 "넣기"만
--
-- 새 표는 없다. 표 권한(grant)은 지금 그대로다.

-- 1) programs
drop policy if exists "admin can insert programs" on public.programs;
drop policy if exists "admin can update programs" on public.programs;
drop policy if exists "admin can delete programs" on public.programs;
drop policy if exists "admin can read all programs" on public.programs;      -- 대기·반려 카드까지 보였다

-- 2) community_posts (방문자가 글을 쓰는 기능은 없다)
drop policy if exists "community_posts_insert" on public.community_posts;
drop policy if exists "community_posts_update" on public.community_posts;
drop policy if exists "community_posts_delete" on public.community_posts;
drop policy if exists "community_posts_select_all" on public.community_posts; -- 비공개 글까지 보였다

-- 3) reports (제보함): 방문자는 넣기만
drop policy if exists "admin can read reports" on public.reports;
drop policy if exists "admin can delete reports" on public.reports;
drop policy if exists "anyone can submit report" on public.reports;

-- 도우미의 「궁금했던 것 남기기」는 source_type='helper_question'으로 넣는데
-- 기존 제약이 'link','text'만 받아서 저장이 안 되고 있었다. 같이 맞춘다.
alter table public.reports drop constraint if exists reports_source_type_check;
alter table public.reports add constraint reports_source_type_check
  check (source_type in ('link', 'text', 'helper_question'));

-- 처리 전(pending) 상태로, 4,000자까지만. 화면(app/report)의 제한과 같다.
drop policy if exists "public can submit pending report" on public.reports;
create policy "public can submit pending report" on public.reports
  for insert to anon, authenticated
  with check (status = 'pending' and char_length(content) between 1 and 4000);

-- 되돌리기: 문제가 생기면 코드를 되돌리기 전에 원인을 먼저 본다. 대부분은
-- SUPABASE_SERVICE_ROLE_KEY가 배포에 안 들어간 경우다. 넓은 정책을 다시 만들지 않는다.
