-- 2026.08.25 — 실장이 직접 확인한 결과를 기관 명부에 반영한다
--
-- 왜: 부서 도구로는 막히는데 curl로는 열리는 곳이 절반쯤 된다. 그걸 "막힘"으로
-- 남겨두면 부서가 그 기관을 영원히 안 본다. 8/18부터 7곳이 그 상태였다.
--
-- 되돌리는 법: 각 기관의 reachable을 'unknown'으로, notice_url을 null로 되돌린다.

update orgs set notice_url = 'https://www.yesulsan.kr/notify/notice.jsp',
       last_checked = '2026-08-25',
       notice_note = '2026.08.25 주소 바뀐 것 확인 — notice_list.jsp는 404'
 where notice_url like '%yesulsan%';

update orgs set reachable='open', last_checked='2026-08-25',
       notice_url = coalesce(notice_url, 'https://www.sc.or.kr/news/notice.do'),
       notice_note='2026.08.25 실장 curl 확인 200'
 where name like '%세이브더칠드런%';

update orgs set reachable='open', last_checked='2026-08-25',
       notice_url = coalesce(notice_url, 'https://www.worldvision.or.kr/business/notice'),
       notice_note='2026.08.25 실장 curl 확인 200'
 where name like '%월드비전%';

update orgs set reachable='open', last_checked='2026-08-25',
       notice_url = coalesce(notice_url, 'https://www.goodneighbors.kr/notice'),
       notice_note='2026.08.25 실장 curl 확인 200'
 where name like '%굿네이버스%';

update orgs set reachable='open', last_checked='2026-08-25',
       notice_note='2026.08.25 실장 curl 확인 200 — 대문은 열리나 공고 게시판 경로는 아직 못 찾음'
 where name like '%초록우산%';

-- 소비자용 앱이라 공고 게시판이 아예 없다. "미확인"으로 두면 부서가 영원히 찾아 헤맨다
update orgs set reachable='n/a', last_checked='2026-08-25',
       notice_note='2026.08.25 확인 — 소비자용 앱이라 공고 게시판이 없다. 공고 링크를 계속 찾을 이유가 없음'
 where name like '%나눔비타민%' or name like '%나비얌%';

update orgs set reachable='blocked', last_checked='2026-08-25',
       notice_note='2026.08.25 실장 재확인 — 연결 자체가 안 됨(인증서 문제). 실제 청소년 폰에서는 열릴 가능성 높음'
 where notice_url like '%ggyouth%';
