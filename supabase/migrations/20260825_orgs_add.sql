-- 2026-08-25 — 조사팀이 찾아온 기관 48곳을 명부에 넣는다
--
-- 이 파일은 `scripts/orgs-add.mjs`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in ('kywa', 'kyci', 'kr-center', 'kosaf', 'work', 'teen1318', 'cando', 'daeguyouth', 'inyouth', 'gj1388', 'dj1388', 'counteen', 'sj1388', 'hi1318', 'gycc', 'cbyouth', 'cnyouth', 'jb1388', 'jnyouth', 'gb1388', 'gn1388', 'jeju1388', 'youthil', 'seoul-jarip', 'daegu-jarip', 'incheon-jarip', 'incheon-jarip-2', 'daejeon-jarip', 'gyeonggi-jarip', 'gyeonggi-jarip-2', 'gyeonggi-jarip-3', 'chungnam-jarip', 'jeju-jarip', 'gangwon-jarip', 'gscf', 'ibkfoundation', 'lottefoundation', 'shinhanfoundation', 'samsungwelfare', 'nexonfoundation', 'donorscamp', 'cmkfoundation-scholarship', 'skhappiness', 'awf', 'ascf', 'sy0404', 'gjc', 'sejong');

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
  ('kywa', '한국청소년활동진흥원', '공공', '전국', array['culture','contest']::text[], 'https://www.kywa.or.kr', null, 'blocked', 'monthly', '17개 시도 청소년활동진흥센터 주관기관. 실장 확인 503 — 우리 쪽에서만 막힘'),
  ('kyci', '한국청소년상담복지개발원', '공공', '전국', array['counseling']::text[], 'https://www.kyci.or.kr', null, 'open', 'monthly', '1388 상담 운영기관. 실장 확인 200'),
  ('kr-center', '학교밖청소년지원센터 꿈드림', '공공', '전국', array['education','career']::text[], null, null, 'unknown', 'monthly', '전국 220여 센터. 주소를 확인 못 해 비워둠 — kdream.or.kr은 어느 형태로도 안 열리고 공식 CSV에도 없다'),
  ('kosaf', '한국장학재단', '공공', '전국', array['education']::text[], 'https://www.kosaf.go.kr', null, 'open', 'monthly', '국가장학금·학자금대출. 실장 확인 200'),
  ('work', '워크넷', '공공', '전국', array['career']::text[], 'https://www.work.go.kr', null, 'open', 'monthly', '청년 코너 있음. 14세 대상 여부 확인 필요. 실장 확인 200'),
  ('teen1318', '서울시청소년상담복지센터', '지역거점', '서울', array['counseling']::text[], 'https://www.teen1318.or.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('cando', '부산광역시청소년상담복지센터', '지역거점', '부산', array['counseling']::text[], 'http://www.cando.or.kr', null, 'unknown', 'monthly', '시도 대표. 실장 확인 http 200 (https는 안 열림)'),
  ('daeguyouth', '대구광역시청소년상담복지센터', '지역거점', '대구', array['counseling']::text[], 'https://www.daeguyouth.net', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('inyouth', '인천광역시청소년상담복지센터', '지역거점', '인천', array['counseling']::text[], 'https://www.inyouth.or.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('gj1388', '광주광역시청소년상담복지센터', '지역거점', '광주', array['counseling']::text[], 'https://www.gj1388.or.kr', null, 'blocked', 'monthly', '시도 대표. 실장 확인 연결 안 됨. 주소는 성평등가족부 공식 CSV에 적힌 것'),
  ('dj1388', '대전광역시청소년상담복지센터', '지역거점', '대전', array['counseling']::text[], 'https://www.dj1388.or.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('counteen', '울산광역시청소년상담복지센터', '지역거점', '울산', array['counseling']::text[], 'http://www.counteen.or.kr', null, 'unknown', 'monthly', '시도 대표. 실장 확인 http 200 (https는 안 열림)'),
  ('sj1388', '세종특별자치시청소년상담복지센터', '지역거점', '세종', array['counseling']::text[], 'https://www.sj1388.or.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('hi1318', '경기도청소년상담복지센터', '지역거점', '경기', array['counseling']::text[], 'https://www.hi1318.or.kr', null, 'blocked', 'monthly', '시도 대표. 실장 확인 503 — 우리 쪽에서만 막힘'),
  ('gycc', '강원특별자치도청소년상담복지센터', '지역거점', '강원', array['counseling']::text[], 'https://www.gycc.org', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('cbyouth', '충청북도청소년상담복지센터', '지역거점', '충북', array['counseling']::text[], 'https://1388.cbyouth.net', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('cnyouth', '충청남도청소년상담복지센터', '지역거점', '충남', array['counseling']::text[], 'https://cnyouth.or.kr', null, 'blocked', 'monthly', '시도 대표. 실장 확인 연결 안 됨. 주소는 성평등가족부 공식 CSV에 적힌 것'),
  ('jb1388', '전라북도청소년상담복지센터', '지역거점', '전북', array['counseling']::text[], 'https://www.jb1388.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('jnyouth', '전라남도청소년상담복지센터', '지역거점', '전남', array['counseling']::text[], 'https://www.jnyouth.or.kr', null, 'blocked', 'monthly', '시도 대표. 실장 확인 연결 안 됨. 주소는 성평등가족부 공식 CSV에 적힌 것'),
  ('gb1388', '경상북도청소년상담복지센터', '지역거점', '경북', array['counseling']::text[], 'https://gb1388.or.kr', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('gn1388', '경상남도청소년상담복지센터', '지역거점', '경남', array['counseling']::text[], 'https://gn1388.gnyouth.net', null, 'open', 'monthly', '시도 대표. 실장 확인 200'),
  ('jeju1388', '제주특별자치도청소년상담복지센터', '지역거점', '제주', array['counseling']::text[], 'https://www.jeju1388.or.kr', null, 'blocked', 'monthly', '시도 대표. 실장 확인 503 — 우리 쪽에서만 막힘'),
  ('youthil', '관악청소년자립지원관(들꽃)', '지역거점', '서울', array['housing']::text[], 'https://www.youthil.or.kr', null, 'blocked', 'monthly', '자립지원관. 실장 확인 503 — 우리 쪽에서만 막힘'),
  ('seoul-jarip', '서울시립청소년자립지원관', '지역거점', '서울', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 02-6959-5012'),
  ('daegu-jarip', '대구광역시청소년자립지원관', '지역거점', '대구', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 053-657-1924'),
  ('incheon-jarip', '인천시청소년자립지원관(별바라기)', '지역거점', '인천', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 032-875-1319'),
  ('incheon-jarip-2', '인천시청소년자립지원관(행복자리)', '지역거점', '인천', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 032-467-1398'),
  ('daejeon-jarip', '대전청소년자립지원관', '지역거점', '대전', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 042-482-1924'),
  ('gyeonggi-jarip', '경기남부청소년자립지원관', '지역거점', '경기', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 031-360-1824'),
  ('gyeonggi-jarip-2', '경기북부청소년자립지원관', '지역거점', '경기', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 031-928-1316'),
  ('gyeonggi-jarip-3', '성남시청소년자립지원관', '지역거점', '경기', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 031-723-7942'),
  ('chungnam-jarip', '천안청소년자립지원관', '지역거점', '충남', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 041-578-1380'),
  ('jeju-jarip', '제주특별자치도청소년자립지원관', '지역거점', '제주', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 064-721-1824'),
  ('gangwon-jarip', '강릉시청소년자립지원관', '지역거점', '강원', array['housing']::text[], null, null, 'unknown', 'monthly', '홈페이지 못 찾음. 전화 033-646-1424'),
  ('gscf', 'GS칼텍스재단', '기업재단', '전국', array['culture','education']::text[], 'https://www.gscf.or.kr', null, 'open', 'monthly', '공고 위치 미확인. 실장 확인 200'),
  ('ibkfoundation', 'IBK행복나눔재단', '기업재단', '전국', null, 'https://www.ibkfoundation.or.kr', null, 'open', 'monthly', '공고 위치 미확인. 실장 확인 200'),
  ('lottefoundation', '롯데재단', '기업재단', '전국', null, 'https://www.lottefoundation.or.kr', null, 'open', 'monthly', '아동 중심. 14세 이상 대상 확인 필요. 실장 확인 200'),
  ('shinhanfoundation', '신한금융희망재단', '기업재단', '전국', null, 'https://www.shinhanfoundation.or.kr', null, 'open', 'monthly', '신한장학재단과 별개 법인. 실장 확인 200'),
  ('samsungwelfare', '삼성복지재단', '기업재단', '전국', null, 'https://samsungwelfare.org', null, 'open', 'monthly', '공고 위치 미확인. 실장 확인 200'),
  ('nexonfoundation', '넥슨재단', '기업재단', '전국', null, 'https://nexonfoundation.org', null, 'open', 'monthly', '공고 위치 미확인. 실장 확인 200'),
  ('donorscamp', 'CJ나눔재단', '기업재단', '전국', array['education','culture']::text[], 'https://www.donorscamp.org', null, 'open', 'monthly', '도너스캠프. 청소년 문화동아리·꿈키움 장학. 실장 확인 200'),
  ('cmkfoundation-scholarship', '현대차정몽구재단', '기업재단', '전국', array['education']::text[], 'https://www.cmkfoundation-scholarship.org', null, 'open', 'monthly', '장학생 선발 전용 사이트. 실장 확인 200'),
  ('skhappiness', 'SK행복나눔재단', '기업재단', '전국', null, 'https://skhappiness.org', null, 'open', 'monthly', '자립·청년 중심. 14세 대상 여부 확인 필요. 실장 확인 200'),
  ('awf', '아모레퍼시픽공감재단', '기업재단', '전국', null, 'https://awf.amorepacific.co.kr', null, 'blocked', 'monthly', '청년 중심. 14세 포함 여부 확인 필요. 실장 확인 연결 안 됨. amorepacific.co.kr 본체도 안 닿아 우리 쪽 문제로 보임'),
  ('ascf', '아모레퍼시픽재단', '기업재단', '전국', array['education']::text[], 'https://ascf.amorepacific.co.kr', null, 'open', 'monthly', '학술연구·장학. 실장 확인 200'),
  ('sy0404', '서울특별시청소년활동진흥센터', '공공', '서울', array['culture','contest']::text[], 'https://www.sy0404.or.kr', null, 'open', 'monthly', '주소 재확인 필요. 실장 확인 200'),
  ('gjc', '광주광역시청소년활동진흥센터', '공공', '광주', array['culture','contest']::text[], 'http://www.gjc.kr', null, 'unknown', 'monthly', '명칭·주소 재확인 필요. 실장 확인 http 200 (https는 안 열림). 명칭 재확인 필요'),
  ('sejong', '세종특별자치시청소년활동진흥센터', '공공', '세종', array['culture','contest']::text[], 'https://www2.sejong.go.kr/youth', null, 'open', 'monthly', '지자체 직영 포털. 실장 확인 200')
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
