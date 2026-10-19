-- 2026-10-19 — 조사팀이 찾아온 기관 7곳을 명부에 넣는다
--
-- 이 파일은 `scripts/orgs-add.mjs`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in ('gjjarip', 'jnjarip', 'djjarip', 'gwjarip', 'jbjarip', 'kbjarip', 'youthzone');

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
  ('gjjarip', '광주자립지원전담기관', '공공', '광주', array['housing','living']::text[], 'https://www.gjjarip.or.kr', 'https://www.gjjarip.or.kr/board/board.php?b_id=8', 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 자립생활관·역량강화교육 신청 게시판도 있음'),
  ('jnjarip', '전남자립지원전담기관', '공공', '전남', array['housing','living']::text[], 'https://www.jnjarip.or.kr', 'https://www.jnjarip.or.kr/bbs/board.php?bo_table=tl_notice', 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 프로그램 신청 게시판 있음'),
  ('djjarip', '대전광역시자립지원전담기관', '공공', '대전', array['housing','living']::text[], 'https://www.djjarip.or.kr', null, 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 공지 게시판 주소는 못 찾음(메뉴가 스크립트)'),
  ('gwjarip', '강원특별자치도자립지원전담기관', '공공', '강원', array['housing','living']::text[], 'https://gwjarip.or.kr', 'https://gwjarip.or.kr/notice', 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 교육·프로그램 신청 게시판 있음'),
  ('jbjarip', '굿네이버스 전북특별자치도자립지원전담기관', '공공', '전북', array['housing','living']::text[], 'https://jbjarip.gnk.or.kr', 'https://jbjarip.gnk.or.kr/gnjbjarip/board/cd103101100/default', 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 굿네이버스 위탁'),
  ('kbjarip', '경상북도자립지원전담기관', '공공', '경북', array['housing','living']::text[], 'https://www.kbjarip.or.kr', null, 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 공지 게시판 주소는 못 찾음'),
  ('youthzone', '시립금천여자단기청소년쉼터', '공공', '서울', array['housing']::text[], 'https://www.youthzone.or.kr', 'https://www.youthzone.or.kr/y41', 'unknown', 'monthly', '실장 크롬 확인 (2026-10-19) · 여자 청소년 단기 쉼터')
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
