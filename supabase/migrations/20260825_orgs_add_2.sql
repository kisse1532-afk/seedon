-- 2026-08-25 — 조사팀이 찾아온 기관 10곳을 명부에 넣는다
--
-- 이 파일은 `scripts/orgs-add.mjs`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in ('greenfund', 'hcroh', '416foundation', 'soaam', 'daumfoundation', 'heart-heart', 'smilegatefoundation', 'volunteer', 'habitat', 'kumsn');

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
  ('greenfund', '환경재단', '비영리', '전국', array['culture','contest']::text[], 'https://www.greenfund.org', null, 'open', 'monthly', '어린이환경센터에서 아동·청소년 환경교육 운영. 실장 확인 200'),
  ('hcroh', '노회찬재단', '비영리', '전국', null, 'https://hcroh.org', null, 'unknown', 'monthly', '희망악기 지원은 학교·시설 단위 신청(개인 아님). 실장 확인 403 — 우리 쪽에서만 막힘'),
  ('416foundation', '4·16재단', '비영리', '전국', array['education']::text[], 'https://416foundation.org', null, 'open', 'monthly', '장학사업 있음, 개인 신청 구조인지 확인 필요. 실장 확인 200'),
  ('soaam', '한국소아암재단', '비영리', '전국', array['living']::text[], 'https://www.soaam.net', null, 'open', 'monthly', '소아암·희귀난치병 아동청소년 의료비 지원. 14세 이상 포함 여부 확인 필요. 실장 확인 200'),
  ('daumfoundation', '다음세대재단', '비영리', '전국', array['education']::text[], 'https://www.daumfoundation.org', null, 'open', 'monthly', '아동·청소년 미디어 교육. 실장 확인 200'),
  ('heart-heart', '하트-하트재단', '비영리', '전국', array['culture']::text[], 'https://www.heart-heart.org', null, 'open', 'monthly', '발달장애 아동청소년 음악교육(오케스트라). 실장 확인 200'),
  ('smilegatefoundation', '스마일게이트 소셜임팩트', '기업재단', '전국', array['career']::text[], 'https://www.smilegatefoundation.org', null, 'open', 'monthly', '청소년 창의 프로그램 SEED. 옛 이름 희망스튜디오와의 관계 확인 필요. 실장 확인 200'),
  ('volunteer', '서울시자원봉사센터', '공공', '서울', array['culture']::text[], 'https://volunteer.seoul.go.kr', null, 'open', 'monthly', '청소년 봉사학습 프로그램. 실장 확인 200'),
  ('habitat', '한국해비타트', '비영리', '전국', array['career']::text[], 'https://www.habitat.or.kr', null, 'open', 'monthly', '고등학생 동아리(CCYP) 자원봉사. 개인 신청 경로 확인 필요. 실장 확인 200'),
  ('kumsn', '한국미혼모지원네트워크', '비영리', '전국', array['living']::text[], 'https://kumsn.org', null, 'open', 'monthly', '10대 미혼모 포함 여부 확인 필요. 실장 확인 200')
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
