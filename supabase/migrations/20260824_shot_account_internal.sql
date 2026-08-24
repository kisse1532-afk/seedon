-- 2026.08.24 — 화면 촬영용 계정을 집계에서 미리 빼둔다
--
-- 왜: 로그인해야 보이는 화면(커뮤니티·북마크·맞춤추천 결과)을 8/18 이후
-- 한 번도 못 봤다. 찍으려면 로그인한 계정이 하나 필요한데, 그 계정이
-- 누른 것이 카드 성적표에 섞이면 "아무도 안 왔다"는 사실이 흐려진다.
-- 그래서 계정을 만들기 전에 목록에 먼저 넣는다.
--
-- 되돌리는 법:
--   delete from public.internal_emails where email = 'seedon_shot@id.seedon.app';

insert into public.internal_emails (email, note) values
  ('seedon_shot@id.seedon.app', '화면 촬영용 계정 (scripts/shot-login.mjs). 사람이 쓰지 않는다')
on conflict (email) do nothing;
