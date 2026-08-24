-- 신청 단계(apply_steps) 문구에서 판정형·행정용어를 걷어냄 (2026.08.19)
--
-- 이 칸은 지금까지 아무도 글자로 훑어본 적이 없었다. 설명(description)과
-- 신청방법(apply_method)만 점검 대상이었고, 단계는 화면에 작게 뜨는 라벨이라
-- 눈에 안 띄었다. `scripts/cards-dump.mjs`를 만들어 단계까지 같이 훑자
-- 절대규칙 1(낙인 문구 금지)에 걸리는 것이 바로 나왔다.
--
-- 제일 나빴던 것 — 초록우산 마인드업:
--   "대상자 발굴 / 심리치료 사각지대 학생 확인"
-- 상담을 받고 싶어 카드를 연 청소년이, 자기가 "발굴"되는 "사각지대 학생"으로
-- 적혀 있는 걸 읽게 된다. 절대규칙 1이 정확히 금지하는 것이다.
--
-- 되돌리려면 아래 '이전 값'을 그대로 다시 넣으면 된다.
--
--   chorogusan-mindup-01     학교/교육복지센터 문의 · 연계 여부 확인
--                            대상자 발굴 · 심리치료 사각지대 학생 확인
--                            방문 상담 · 심리치료사가 학교로 방문
--                            추가 연계 · 필요 시 후속 상담·치료 연계
--   mindcare-voucher-01      대상자 확인 · 의뢰서 3개월 이내
--   cf-living-01             추천 진행 · 초록우산 연계 / 가정 상황 확인 · 필요한 지원 파악
--   gn-01                    추천 진행 · 굿네이버스 연계 / 상황 확인 · 필요한 지원 파악
--   seoul-selfcare-01        심사·선정 · 선정 결과 통보
--   beautifulfund-swimmap-01 선정 심사 · 30명 선발
--
-- 화면(ApplySteps.tsx)은 icon을 안 쓰고 title/subtitle만 그린다. icon은 그대로 뒀다.

update public.programs set apply_steps = '[
  {"icon":"🏫","title":"학교에 물어보기","subtitle":"우리 학교도 하는지 물어봐요"},
  {"icon":"🔍","title":"누가 받을지 정해요","subtitle":"학교랑 초록우산이 같이 정해요"},
  {"icon":"🧑‍⚕️","title":"방문 상담","subtitle":"상담 선생님이 학교로 와요"},
  {"icon":"🔗","title":"더 필요하면 이어줘요","subtitle":"상담이 더 필요하면 다른 곳도 소개해줘요"}
]'::jsonb where id = 'chorogusan-mindup-01';

update public.programs set apply_steps = '[
  {"icon":"🧑‍🏫","title":"의뢰서 발급","subtitle":"청소년상담복지센터·Wee센터 등"},
  {"icon":"🌐","title":"복지로 신청","subtitle":"또는 행정복지센터 방문"},
  {"icon":"🔍","title":"서류 확인","subtitle":"의뢰서는 받은 지 3개월 안에"},
  {"icon":"💬","title":"상담 8회 이용","subtitle":"1:1 대면 상담"}
]'::jsonb where id = 'mindcare-voucher-01';

update public.programs set apply_steps = '[
  {"icon":"🧑‍🏫","title":"주민센터·학교 상담","subtitle":"담당자에게 문의"},
  {"icon":"📄","title":"선생님이 추천해줘요","subtitle":"초록우산에 이어줘요"},
  {"icon":"🔍","title":"어떤 도움이 필요한지 이야기해요","subtitle":"무엇이 필요한지 같이 봐요"},
  {"icon":"✅","title":"지원금 지급","subtitle":"최대 100만원"}
]'::jsonb where id = 'cf-living-01';

update public.programs set apply_steps = '[
  {"icon":"🧑‍🏫","title":"기관·학교 상담","subtitle":"담당 선생님께 문의"},
  {"icon":"📄","title":"선생님이 추천해줘요","subtitle":"굿네이버스에 이어줘요"},
  {"icon":"🔍","title":"어떤 도움이 필요한지 이야기해요","subtitle":"무엇이 필요한지 같이 봐요"},
  {"icon":"✅","title":"종합 지원 시작","subtitle":"학습·문화·심리"}
]'::jsonb where id = 'gn-01';

update public.programs set apply_steps = '[
  {"icon":"🏠","title":"가족돌봄정보 등록","subtitle":"서울복지포털 사전 등록"},
  {"icon":"📝","title":"온라인 신청","subtitle":"신청서 작성·서류 제출"},
  {"icon":"🔍","title":"결과 기다리기","subtitle":"되는지 안 되는지 알려줘요"},
  {"icon":"💳","title":"자기돌봄비 지급","subtitle":"전용카드로 매달 지급, 2개월마다 기록서 제출"}
]'::jsonb where id = 'seoul-selfcare-01';

update public.programs set apply_steps = '[
  {"icon":"📅","title":"모집 공고 확인","subtitle":"매년 2월경"},
  {"icon":"📝","title":"신청서 제출","subtitle":"change.beautifulfund.org"},
  {"icon":"🔍","title":"결과 기다리기","subtitle":"30명을 뽑아요"},
  {"icon":"🤝","title":"활동비+멘토링","subtitle":"11개월 지원"}
]'::jsonb where id = 'beautifulfund-swimmap-01';
