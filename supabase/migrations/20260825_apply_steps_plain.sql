-- 2026.08.25 — 단계 칸에 남아 있던 낙인 표현과 어른 말투를 고친다
--
-- ⚠️ 제일 중요한 것: living-01(방과후아카데미)의 단계에
--    **"선발 심사 / 가정형편 등 확인"**이 그대로 떠 있었다.
--    단계는 화면에서 아이콘과 함께 크게 보이는 자리다. 청소년이 신청하려고
--    누르면 "네 가정형편을 확인하겠다"는 말이 아이콘 옆에 붙어 있는 셈이다.
--    절대규칙 1이 금지하는 것이고, 2026.08.19에 apply_steps에서 같은 종류
--    ("대상자 발굴", "사각지대 학생 확인")를 찾아 고쳤는데 이건 남아 있었다.
--    조건을 숨기는 게 아니라, 판정하는 말투를 없앤다 — 설명 칸에는
--    "자세한 기준은 운영기관에 물어보면 알려줘요"가 이미 있다.
--
-- 나머지: "제출/심사/발급"은 중학생이 사전 없이 읽기 어렵다(절대규칙 3).
--
-- 문화누리카드 설명의 "카드발급(신규·재발급·재충전)"은 손대지 않았다 —
-- 그건 우리 말이 아니라 그 사이트에 실제로 적힌 버튼 이름이라,
-- 바꾸면 청소년이 그 페이지에서 못 찾는다.
--
-- 되돌리는 법: 각 값을 이전 문구로 되돌린다.

UPDATE programs SET apply_steps = '[
  {"icon":"🔍","title":"우리 동네 아카데미 찾기","subtitle":"어디서 하는지 검색해봐요"},
  {"icon":"📝","title":"신청서 내기","subtitle":"정부24에서 하거나 직접 찾아가서"},
  {"icon":"⏳","title":"연락 기다리기","subtitle":"자리보다 신청이 많으면 순서를 정해요"},
  {"icon":"✅","title":"다니기 시작","subtitle":"공부도 봐주고 저녁밥도 줘요"}
]'::jsonb WHERE id = 'living-01';

UPDATE programs SET apply_steps = '[
  {"icon":"📅","title":"모집 공고 확인","subtitle":"매년 2월쯤"},
  {"icon":"📝","title":"신청서 내기","subtitle":"change.beautifulfund.org"},
  {"icon":"⏳","title":"결과 기다리기","subtitle":"30명을 뽑아요"},
  {"icon":"🤝","title":"활동비+멘토링","subtitle":"11개월 지원"}
]'::jsonb WHERE id = 'beautifulfund-swimmap-01';

UPDATE programs SET apply_steps = '[
  {"icon":"✅","title":"약관 동의","subtitle":"이용약관·개인정보 동의"},
  {"icon":"🪪","title":"본인 인증","subtitle":"본인이 맞는지 확인해요"},
  {"icon":"📝","title":"신청 정보 입력","subtitle":"카드를 어떻게 받을지 고르기"},
  {"icon":"📬","title":"신청서 내기","subtitle":"카드를 만들어 집으로 보내줘요"}
]'::jsonb WHERE id = 'culture-01';

UPDATE programs SET apply_steps = '[
  {"icon":"🏫","title":"학교 안내 확인","subtitle":"또는 재단 홈페이지에서"},
  {"icon":"📝","title":"신청서 내기","subtitle":"3월쯤 모집해요"},
  {"icon":"🤝","title":"멘토 정해지기","subtitle":"나랑 맞는 대학생을 붙여줘요"},
  {"icon":"📚","title":"멘토링 시작","subtitle":"정기적으로 만나요"}
]'::jsonb WHERE id = 'edu-mentor-01';

UPDATE programs SET apply_steps = '[
  {"icon":"📅","title":"모집 공고 확인","subtitle":"매년 12월~2월"},
  {"icon":"📝","title":"신청서 내기","subtitle":"재단 홈페이지에서"},
  {"icon":"🗣️","title":"서류 보고 면접","subtitle":"만나서 이야기해요"},
  {"icon":"🎓","title":"장학금+멘토링","subtitle":"중등 연300/고등 연360/대학 최대800만원"}
]'::jsonb WHERE id = 'shinhan-jarip-01';

UPDATE programs SET apply_steps = '[
  {"icon":"🌐","title":"LH청약플러스 들어가기","subtitle":"apply.lh.or.kr"},
  {"icon":"🔍","title":"공고 확인","subtitle":"우리 지역 모집 공고"},
  {"icon":"📝","title":"신청서 내기","subtitle":"온라인으로 해요"},
  {"icon":"🏠","title":"들어가 살기","subtitle":"주변 시세의 30~90% 값으로"}
]'::jsonb WHERE id = 'lh-youth-housing-01';
