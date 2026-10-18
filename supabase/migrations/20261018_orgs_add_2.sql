-- 2026-10-18 — 조사팀이 찾아온 기관 37곳을 명부에 넣는다
--
-- 이 파일은 `scripts/orgs-add.mjs`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in ('dbfoundation', 'lg-foundation', 'cjazit', 'kdb-foundation', 'lotteconcerthall', 'donghaengfoundation', 'songeunartspace', 'ilwoo', 'iljufoundation', 'yonkang', 'seoam', 'kacf', 'happybean', 'daelimmuseum', 'daesan', 'woonhyungleefoundation', 'shcfound', 'ocimuseum', 'cityfoundation', 'ktgf', 'centrepompidou-hanwha', 'happygr', 'happyict', 'happyconnect', 'ponychung', 'posef', 'hanafoundation', 'hobancf', 'junsungki', 'sto', 'lxinternational', 'lxpantos', 'maeil', 'hanatour', 'ksure', 'kmi', 'shinkim');

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
  ('dbfoundation', 'DB김준기문화재단', '기업재단', '전국', array['education','contest']::text[], 'https://www.dbfoundation.or.kr', 'https://www.dbfoundation.or.kr/news/notice/notice', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 장학금 신청·보험금융공모전 메뉴 있음'),
  ('lg-foundation', 'LG연암문화재단', '기업재단', '전국', null, 'https://foundation.lg.or.kr', 'https://foundation.lg.or.kr/category/notice/', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · LG재단 통합 사이트 · 청소년 사업 확인 전'),
  ('cjazit', 'CJ문화재단', '기업재단', '전국', array['culture']::text[], 'https://www.cjazit.org', 'https://www.cjazit.org/support/learnfare', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · CJ음악장학사업'),
  ('kdb-foundation', 'KDB나눔재단', '기업재단', '전국', null, 'https://foundation.kdb.co.kr', null, 'unknown', 'quarterly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림 · 청소년 사업 확인 전'),
  ('lotteconcerthall', '롯데문화재단', '기업재단', '서울', array['culture']::text[], 'https://www.lotteconcerthall.com', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 롯데콘서트홀 운영 · 청소년 사업 확인 전'),
  ('donghaengfoundation', '동행복지재단', '기업재단', '전국', null, 'http://donghaengfoundation.or.kr', 'http://donghaengfoundation.or.kr/sub/sub03_01.php', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('songeunartspace', '송은문화재단', '기업재단', '서울', array['culture']::text[], 'https://www.songeunartspace.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 미술관 · 청소년 사업 확인 전'),
  ('ilwoo', '일우재단', '기업재단', '전국', null, 'https://www.ilwoo.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('iljufoundation', '일주학술문화재단', '기업재단', '전국', array['education']::text[], 'https://www.iljufoundation.org', 'https://www.iljufoundation.org/html/educationWelfare.do?contentType=1', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 장학·교육복지 사업'),
  ('yonkang', '두산연강재단', '기업재단', '전국', array['education']::text[], 'https://www.yonkang.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('seoam', 'SBS 서암윤세영재단', '기업재단', '전국', array['education']::text[], 'https://seoam.foundation.sbs.co.kr', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 옛 SBS문화재단 · 청소년 사업 확인 전'),
  ('kacf', '금호문화재단', '기업재단', '전국', array['culture']::text[], 'http://www.kacf.net', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 영재 음악 지원으로 알려짐 · 청소년 사업 확인 전'),
  ('happybean', '네이버 해피빈', '기업재단', '전국', null, 'https://happybean.naver.com', 'https://happybean.naver.com/introduction/NoticeList', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 네이버문화재단 · 청소년 사업 확인 전'),
  ('daelimmuseum', '대림문화재단', '기업재단', '서울', array['culture']::text[], 'https://www.daelimmuseum.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 디뮤지엄 · 청소년 사업 확인 전'),
  ('daesan', '대산문화재단', '기업재단', '전국', array['education','contest']::text[], 'https://www.daesan.or.kr', 'https://www.daesan.or.kr/business.html?d_code=5464', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 장학 및 청소년 육성 사업 메뉴 있음'),
  ('woonhyungleefoundation', '세아이운형문화재단', '기업재단', '전국', array['culture']::text[], 'http://www.woonhyungleefoundation.org', 'http://www.woonhyungleefoundation.org/bbs/board.php?bo_table=notice', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('shcfound', '세화문화재단', '기업재단', '전국', null, 'http://www.shcfound.com', null, 'unknown', 'quarterly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림 · 청소년 사업 확인 전'),
  ('ocimuseum', '송암문화재단 OCI미술관', '기업재단', '서울', array['culture']::text[], 'https://www.ocimuseum.org', 'https://www.ocimuseum.org/board/notice', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('cityfoundation', '시티문화재단', '기업재단', '전국', null, 'https://cityfoundation.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('ktgf', 'KT그룹희망나눔재단', '기업재단', '전국', null, 'https://ktgf.or.kr', 'https://ktgf.or.kr/news/news.php', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · KT 사회공헌 담당 재단 · 청소년 사업 확인 전'),
  ('centrepompidou-hanwha', '한화문화재단 퐁피두센터 한화', '기업재단', '서울', array['culture']::text[], 'https://www.centrepompidou-hanwha.kr', 'https://www.centrepompidou-hanwha.kr/notice/list', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('happygr', '행복그린넷', '기업재단', '전국', null, 'https://happygr.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('happyict', '행복ICT', '기업재단', '전국', array['education']::text[], 'https://www.happyict.co.kr', 'https://www.happyict.co.kr/business/contribution.do', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · IT 사회공헌 · 청소년 사업 확인 전'),
  ('happyconnect', '행복커넥트', '기업재단', '전국', null, 'http://happyconnect.co.kr', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('ponychung', '포니정재단', '기업재단', '전국', array['education']::text[], 'https://www.ponychung.org', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 장학 · 청소년 사업 확인 전'),
  ('posef', '포스코교육재단', '기업재단', '전국', array['education']::text[], 'https://www.posef.or.kr', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 학교 운영 재단 · 청소년 사업 확인 전'),
  ('hanafoundation', '하나금융공익재단', '기업재단', '전국', null, 'https://www.hanafoundation.or.kr', 'https://www.hanafoundation.or.kr/bbs/board.php?bo_table=notice', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 사업 확인 전'),
  ('hobancf', '호반문화재단', '기업재단', '전국', array['culture']::text[], 'http://hobancf.or.kr', null, 'unknown', 'quarterly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림 · 청소년 사업 확인 전'),
  ('junsungki', '라이나전성기재단', '기업재단', '전국', array['counseling']::text[], 'https://www.junsungki.com', 'https://www.junsungki.com/practice/youth.do', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 청소년 대상 신청·참여 메뉴 있음 (라이나생명)'),
  ('sto', '서울관광재단', '공공', '서울', null, 'https://www.sto.or.kr', 'https://www.sto.or.kr/notice', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 모집공고 칸은 직원 채용 위주 · 청소년 사업 확인 전'),
  ('lxinternational', 'LX인터내셔널', '기업', '전국', null, 'https://www.lxinternational.com', 'https://www.lxinternational.com/kr/esg', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · ESG(사회공헌) 페이지 · 청소년 사업 확인 전'),
  ('lxpantos', 'LX판토스', '기업', '전국', null, 'https://www.lxpantos.com', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 페이지 못 찾음 · 청소년 사업 확인 전'),
  ('maeil', '매일유업', '기업', '전국', null, 'https://www.maeil.com', 'https://www.maeil.com/contribution/nanumList.jsp', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 나눔소식 · 청소년 사업 확인 전'),
  ('hanatour', '하나투어', '기업', '전국', null, 'https://www.hanatour.com', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 페이지 못 찾음 · 청소년 사업 확인 전'),
  ('ksure', '한국무역보험공사', '공공', '전국', null, 'https://www.ksure.or.kr', null, 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 페이지 못 찾음 · 청소년 사업 확인 전'),
  ('kmi', 'KMI한국의학연구소', '민간', '전국', null, 'https://www.kmi.or.kr', 'https://www.kmi.or.kr/RCH/CONTRI', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 페이지 · 청소년 사업 확인 전'),
  ('shinkim', '법무법인(유) 세종', '기업', '서울', null, 'https://www.shinkim.com', 'https://www.shinkim.com/kor/about/contribution', 'open', 'quarterly', '실장 확인 200 (2026-10-18) · 사회공헌 페이지 (사단법인 나눔과이음) · 청소년 사업 확인 전')
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
