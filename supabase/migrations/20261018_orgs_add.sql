-- 2026-10-18 — 조사팀이 찾아온 기관 39곳을 명부에 넣는다
--
-- 이 파일은 `scripts/orgs-add.mjs`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in ('ymcakorea', 'seoulymca', 'ywca', 'jikimi', 'grouphome', 'koya', 'kyca', 'rainbowyouth', 'greatvision', 'seoulallnet', 'wahaha', 'gbdream', 'withu', 'iseum', 'holt', 'globalansan', 'kpf', 'sejongpac', 'v1365', 'dooeul', 'woorifoundation', 'ktng-scholarship', 'asanfoundation', 'hana-nanum', 'kbfoundation', 'hobansf', 'woojungedu', 'miraeasset-foundation', 'elandcsr', 'wjf', 'dkculture', 'ncfoundation', 'netmarblefoundation', 'orionfoundation', 'nonghyup-foundation', 'hankooktirefoundation', 'knbnanum', 'paradise', 'gmkorea-foundation');

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
  ('ymcakorea', '한국YMCA전국연맹', '민간', '전국', array['culture']::text[], 'https://www.ymcakorea.kr', 'https://ymcakorea.kr/notice', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('seoulymca', '서울YMCA', '민간', '서울', array['culture']::text[], 'https://www.seoulymca.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('ywca', '한국YWCA연합회', '민간', '전국', array['culture']::text[], 'http://www.ywca.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('jikimi', '한국청소년쉼터협의회', '민간', '전국', array['housing']::text[], 'http://www.jikimi.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('grouphome', '한국아동청소년그룹홈협의회', '민간', '전국', array['housing']::text[], 'https://www.grouphome.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 보안 인증서 오류'),
  ('koya', '한국청소년연맹', '민간', '전국', array['culture','contest']::text[], 'https://koya.or.kr', 'https://koya.or.kr/community/notice', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('kyca', '한국청소년동아리연맹', '민간', '전국', array['culture']::text[], 'http://www.kyca.net', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('rainbowyouth', '이주배경청소년지원재단 무지개청소년센터', '공공', '전국', array['education','counseling']::text[], 'https://www.rainbowyouth.or.kr', 'https://www.rainbowyouth.or.kr/posts/rwdboard/list.do', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('greatvision', '한꿈학교', '민간', '경기', array['education']::text[], 'http://www.greatvision.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('seoulallnet', '서울시 학교밖청소년지원센터', '공공', '서울', array['education']::text[], 'https://seoulallnet.org', 'https://seoulallnet.org/board/notice', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 학업비·인턴십 신청 화면 있음'),
  ('wahaha', '들꽃청소년세상', '민간', '전국', array['housing']::text[], 'http://www.wahaha.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('gbdream', '서울시립 강북청소년드림센터', '공공', '서울', array['education']::text[], 'http://www.gbdream.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('withu', '함께걷는아이들', '민간', '서울', array['education']::text[], 'http://www.withu.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('iseum', '아동복지실천회 세움', '민간', '전국', array['counseling']::text[], 'https://iseum.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('holt', '홀트아동복지회', '민간', '전국', array['living']::text[], 'https://love.holt.or.kr', 'https://love.holt.or.kr/join/support/', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('globalansan', '안산시글로벌청소년센터', '공공', '경기', array['education']::text[], 'https://www.globalansan.com', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('kpf', '한국언론진흥재단', '공공', '전국', array['education']::text[], 'https://www.kpf.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공모/신청은 대문 탭 안에 있음'),
  ('sejongpac', '세종문화회관', '공공', '서울', array['culture']::text[], 'https://www.sejongpac.or.kr', 'https://www.sejongpac.or.kr/portal/bbs/B0000062/list.do?menuNo=200333', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('v1365', '한국중앙자원봉사센터', '공공', '전국', array['culture']::text[], 'http://www.v1365.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('dooeul', '두을장학재단', '기업재단', '전국', array['education']::text[], 'http://www.dooeul.or.kr', 'http://www.dooeul.or.kr/home/main/board/bbsNormalList.do?encMenuId=456e4a7650636263787265524c786556464e424c4e773d3d', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 대상 나이 확인 필요'),
  ('woorifoundation', '우리다문화장학재단', '기업재단', '전국', array['education']::text[], 'https://woorifoundation.or.kr', 'https://woorifoundation.or.kr/html/apply/sch', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('ktng-scholarship', 'KT&G장학재단', '기업재단', '전국', array['education']::text[], 'https://scholarship.ktngtogether.com', 'https://scholarship.ktngtogether.com/bbsctt/list.do?key=2309040011', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('asanfoundation', '아산사회복지재단', '기업재단', '전국', array['living']::text[], 'https://www.asanfoundation.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('hana-nanum', '하나금융나눔재단', '기업재단', '전국', array['education']::text[], 'https://www.hana-nanum.com', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('kbfoundation', 'KB금융공익재단', '기업재단', '전국', array['education']::text[], 'https://www.kbfoundation.or.kr', 'https://www.kbfoundation.or.kr/course/offline.do', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 교육신청'),
  ('hobansf', '호반장학재단', '기업재단', '전국', array['education']::text[], 'https://www.hobansf.or.kr', 'https://www.hobansf.or.kr/kr/news/notice/list', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 대상 나이 확인 필요'),
  ('woojungedu', '우정교육문화재단', '기업재단', '전국', array['education']::text[], 'https://www.woojungedu.co.kr', 'https://www.woojungedu.co.kr/boards/4', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 대상 나이 확인 필요'),
  ('miraeasset-foundation', '미래에셋박현주재단', '기업재단', '전국', array['education']::text[], 'https://foundation.miraeasset.com', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('elandcsr', '이랜드복지재단', '기업재단', '전국', array['living']::text[], 'https://www.elandcsr.or.kr', 'https://www.elandcsr.or.kr/Community/NoticeList', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('wjf', '웅진재단', '기업재단', '전국', array['education']::text[], 'https://www.wjf.kr', 'https://www.wjf.kr/inform/notice_list.aspx', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 수학·과학·예술 영재 장학'),
  ('dkculture', '대교문화재단', '기업재단', '전국', array['education']::text[], 'https://dkculture.org', 'https://dkculture.org/ko/news/newslist.aspx', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('ncfoundation', '엔씨문화재단', '기업재단', '전국', array['culture']::text[], 'https://www.ncfoundation.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('netmarblefoundation', '넷마블문화재단', '기업재단', '전국', array['culture','contest']::text[], 'https://www.netmarblefoundation.org', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('orionfoundation', '오리온재단', '기업재단', '전국', array['education']::text[], 'http://www.orionfoundation.or.kr', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('nonghyup-foundation', '농협재단', '기업재단', '전국', array['education']::text[], 'https://jaedan.nonghyup.com', null, 'unknown', 'monthly', '다음 검색으로 주소 확인, 클라우드에서는 안 열림'),
  ('hankooktirefoundation', '한국타이어나눔재단', '기업재단', '전국', array['living']::text[], 'https://hankooktirefoundation.or.kr', 'https://hankooktirefoundation.or.kr/bbs/board.php?bo_table=B31', 'open', 'monthly', '실장 확인 200 (2026-10-18)'),
  ('knbnanum', '경남은행사랑나눔재단', '기업재단', '경남', array['education']::text[], 'https://www.knbnanum.or.kr', 'https://www.knbnanum.or.kr/bbs/board.php?bo_table=scnotice', 'open', 'monthly', '실장 확인 200 (2026-10-18) · 장학회 공지'),
  ('paradise', '파라다이스복지재단', '기업재단', '전국', array['living']::text[], 'https://paradise.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18) · 공지 게시판 링크는 자동으로 못 찾음'),
  ('gmkorea-foundation', '지엠한마음재단코리아', '기업재단', '인천', array['living']::text[], 'https://www.gmkorea-foundation.or.kr', null, 'open', 'monthly', '실장 확인 200 (2026-10-18)')
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
