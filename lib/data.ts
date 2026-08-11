export type Category =
  | "education"
  | "counseling"
  | "housing"
  | "living"
  | "career"
  | "culture";

export const categories: { slug: Category; label: string; emoji: string }[] = [
  { slug: "education", label: "교육", emoji: "📚" },
  { slug: "counseling", label: "심리상담", emoji: "💬" },
  { slug: "housing", label: "주거", emoji: "🏠" },
  { slug: "living", label: "경제·생활비", emoji: "💳" },
  { slug: "career", label: "진로·취업", emoji: "🧭" },
  { slug: "culture", label: "문화체험", emoji: "🎨" },
];

export type OrgType = "public" | "nonprofit";

export type ApplyStep = {
  icon: string;
  title: string;
  subtitle: string;
};

export type Program = {
  id: string;
  title: string;
  org: string;
  description: string;
  category: Category;
  tags: string[];
  link?: string;
  org_type?: OrgType;
  apply_method?: string;
  apply_link_label?: string;
  apply_steps?: ApplyStep[];
  phone?: string;
  last_verified_at?: string;
};

// Supabase 연결 실패 시 폴백용 (2026.08 리서치 기준, 공공+비영리, 신청 URL·단계 재검증 완료)
export const programs: Program[] = [
  {
    id: "edu-01",
    title: "교육급여",
    org: "교육부·보건복지부",
    description:
      "집안 형편이 어려운 초·중·고 학생에게 나라가 매년 한 번씩 학용품비, 체험학습비 같은 데 쓸 수 있는 돈을 카드에 넣어줘요. 초등학생은 50만 2천원, 중학생은 69만 9천원, 고등학생은 86만원을 받을 수 있어요.",
    category: "education",
    tags: ["교육급여", "바우처", "정부지원"],
    link: "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00001089",
    org_type: "public",
    apply_method:
      "복지로(bokjiro.go.kr) 온라인 신청(공동인증서 필요) 또는 행정복지센터 방문 신청",
    apply_link_label: "복지로에서 신청 정보 보기 ↗",
    apply_steps: [
      { icon: "🌐", title: "복지로 접속", subtitle: "공동인증서 로그인" },
      { icon: "📝", title: "신청서 작성", subtitle: "가구 정보 확인" },
      { icon: "📤", title: "제출", subtitle: "온라인 또는 방문 제출" },
      { icon: "✅", title: "결과 통보", subtitle: "심사 후 카드 지급" },
    ],
    phone: "129",
  },
  {
    id: "culture-01",
    title: "문화누리카드",
    org: "한국문화예술위원회",
    description:
      "영화, 공연, 책, 여행 같은 데 쓸 수 있는 문화용 카드예요. 한 사람당 1년에 15만원(만 13~18세는 1만원 더!)을 충전해줘요.",
    category: "culture",
    tags: ["바우처", "연 1회", "정부지원"],
    link: "https://www.mnuri.kr/card/cardMain/cardIssue_step00.do",
    org_type: "public",
    apply_method: "mnuri.kr에서 온라인 신청(4단계) 또는 주민센터 방문 신청",
    apply_link_label: "문화누리카드 온라인 신청하기 ↗",
    apply_steps: [
      { icon: "✅", title: "약관 동의", subtitle: "이용약관·개인정보 동의" },
      { icon: "🪪", title: "본인 인증", subtitle: "본인 확인 절차" },
      { icon: "📝", title: "신청 정보 입력", subtitle: "수령 방법 선택" },
      { icon: "📬", title: "신청서 제출", subtitle: "카드 발급·배송" },
    ],
    phone: "1544-3412",
  },
  {
    id: "counsel-01",
    title: "청소년동반자 프로그램 (1388)",
    org: "여성가족부·청소년상담복지센터",
    description:
      "우울, 자해, 학교폭력, 가출, 학업중단 등 어떤 고민이든 무료로 상담받을 수 있어요 (기본 12회기, 완전 무료).",
    category: "counseling",
    tags: ["무료", "비밀보장", "24시간"],
    link: "https://www.youth.go.kr/youth/youth/contents/yngbgsCnsltForm.yt",
    org_type: "public",
    apply_method: "청소년전화 1388 전화·문자, 카카오톡 청소년상담1388 채널",
    apply_link_label: "온라인 상담 신청하기 ↗",
    apply_steps: [
      { icon: "☎️", title: "1388 연락", subtitle: "전화·문자·카톡 아무거나" },
      { icon: "🧑‍💼", title: "상담사 연결", subtitle: "24시간 누군가 받아줘요" },
      { icon: "💬", title: "고민 나누기", subtitle: "비밀 보장돼요" },
      { icon: "🤝", title: "필요한 지원 연결", subtitle: "동반자 프로그램 등" },
    ],
    phone: "1388",
  },
  {
    id: "housing-01",
    title: "청소년쉼터",
    org: "여성가족부",
    description:
      "집에 있기 힘들거나 갈 곳이 없을 때, 잠깐 지낼 수 있는 안전한 곳을 연결해줘요. 자립 지원까지 이어져요.",
    category: "housing",
    tags: ["주거", "자립", "긴급"],
    link: "https://www.mogef.go.kr/sp/yth/sp_yth_f014.do",
    org_type: "public",
    apply_method: "1388 전화 연결 또는 가까운 청소년쉼터 직접 방문",
    apply_link_label: "청소년쉼터 안내 보기 ↗",
    apply_steps: [
      { icon: "☎️", title: "1388 전화", subtitle: "또는 쉼터 직접 방문" },
      { icon: "🧑‍💼", title: "상담", subtitle: "지금 상황 이야기하기" },
      { icon: "🏠", title: "쉼터 연결", subtitle: "가까운 쉼터 안내" },
      { icon: "✅", title: "입소", subtitle: "바로 지낼 곳 생김" },
    ],
    phone: "1388",
  },
  {
    id: "living-01",
    title: "청소년 방과후아카데미",
    org: "여성가족부",
    description:
      "학교 끝나고 혼자 있어야 하는 초4~중3 청소년에게 학습·생활 프로그램과 저녁밥을 거의 무료로 제공해요.",
    category: "living",
    tags: ["무료", "돌봄", "저소득 우선"],
    link: "https://www.youth.go.kr/yaca",
    org_type: "public",
    apply_method: "정부24(gov.kr) 온라인 신청 또는 운영기관 방문 신청",
    apply_link_label: "방과후아카데미 찾아보기 ↗",
    apply_steps: [
      { icon: "🔍", title: "운영기관 찾기", subtitle: "우리 동네 아카데미 검색" },
      { icon: "📝", title: "신청서 제출", subtitle: "정부24 또는 방문 신청" },
      { icon: "🧑‍💼", title: "선발 심사", subtitle: "가정형편 등 확인" },
      { icon: "✅", title: "프로그램 시작", subtitle: "학습·저녁밥 제공" },
    ],
  },
  {
    id: "career-01",
    title: "꿈길 진로체험",
    org: "교육부",
    description:
      "궁금했던 직업을 진짜로 체험해볼 수 있는 무료 프로그램이에요. 하루짜리 견학부터 캠프까지 다양해요.",
    category: "career",
    tags: ["무료", "체험", "온라인신청"],
    link: "https://www.ggoomgil.go.kr/",
    org_type: "public",
    apply_method: "ggoomgil.go.kr 온라인 신청 또는 학교 진로선생님 통해 신청",
    apply_link_label: "꿈길에서 체험 신청하기 ↗",
    apply_steps: [
      { icon: "🌐", title: "꿈길 회원가입", subtitle: "ggoomgil.go.kr" },
      { icon: "🔍", title: "체험처 검색", subtitle: "관심 직업 찾기" },
      { icon: "📝", title: "신청하기", subtitle: "원하는 날짜 선택" },
      { icon: "✅", title: "체험 참여", subtitle: "승인 후 참여" },
    ],
  },
  {
    id: "dream-01",
    title: "드림세이버 꿈 지원금",
    org: "세이브더칠드런",
    description:
      "멘토가 진로 고민을 함께 나눠주고, 1년에 최대 200만원까지 꿈 지원금도 줘요. 위기 상황 청소년의 잠재력을 키우는 프로그램이에요.",
    category: "career",
    tags: ["멘토링", "지원금", "비영리"],
    link: "https://www.sc.or.kr",
    org_type: "nonprofit",
    apply_method:
      "개인이 직접 온라인으로 신청하는 프로그램이 아니에요. 학교·지역아동센터·복지관 선생님을 통한 추천으로 진행돼요. 문의: 02-6900-4400",
    apply_link_label: "세이브더칠드런 알아보기 ↗",
    apply_steps: [
      { icon: "🧑‍🏫", title: "선생님과 상담", subtitle: "학교·지역아동센터·복지관" },
      { icon: "📄", title: "추천서 작성", subtitle: "기관에서 도와줘요" },
      { icon: "🔍", title: "기관 심사", subtitle: "세이브더칠드런 확인" },
      { icon: "✅", title: "멘토링·지원금 시작", subtitle: "최대 200만원" },
    ],
    phone: "02-6900-4400",
  },
  {
    id: "gn-01",
    title: "희망나눔꿈지원사업",
    org: "굿네이버스",
    description:
      "형편이 어려운 가정의 아동·청소년이 스스로 꿈을 찾고 키워갈 수 있도록 학습·문화·심리 지원을 종합 연결해줘요.",
    category: "career",
    tags: ["종합지원", "비영리", "심리지원"],
    link: "https://www.goodneighbors.kr/business/korea_welfare/empowerment.gn",
    org_type: "nonprofit",
    apply_method:
      "개인 온라인 신청보다는 학교나 지역 사회복지기관을 통한 추천으로 진행돼요. 가까운 지역사무소로 문의해보세요.",
    apply_link_label: "굿네이버스 알아보기 ↗",
    apply_steps: [
      { icon: "🧑‍🏫", title: "기관·학교 상담", subtitle: "담당 선생님께 문의" },
      { icon: "📄", title: "추천 진행", subtitle: "굿네이버스 연계" },
      { icon: "🔍", title: "상황 확인", subtitle: "필요한 지원 파악" },
      { icon: "✅", title: "종합 지원 시작", subtitle: "학습·문화·심리" },
    ],
  },
  {
    id: "puum-01",
    title: "품 (puum)",
    org: "사단법인 비투비",
    description:
      "임신했는데 막막하거나 어린 나이에 부모가 됐을 때, 지금 상황에 맞는 지원 정보(의료비·생활비·주거·상담)를 찾아주는 앱이에요.",
    category: "counseling",
    tags: ["임신·양육", "상담", "비영리"],
    link: "https://puum.me/",
    org_type: "nonprofit",
    apply_method: "puum.me에서 상황 입력하면 맞춤 정보 확인, 상담 예약도 가능",
    apply_link_label: "puum 앱에서 확인하기 ↗",
    apply_steps: [
      { icon: "📱", title: "puum.me 접속", subtitle: "앱 또는 웹" },
      { icon: "📝", title: "내 상황 입력", subtitle: "임신·양육 상황" },
      { icon: "🔍", title: "맞춤 정보 확인", subtitle: "의료비·생활비 등" },
      { icon: "📅", title: "상담 예약", subtitle: "필요하면 바로" },
    ],
  },
  {
    id: "edu-mentor-01",
    title: "대학생청소년교육지원사업",
    org: "아름다운재단·한국장학재단",
    description:
      "대학생 멘토가 짝을 이뤄 공부를 도와주는 무료 멘토링이에요. 학교 진도를 못 따라갈 때 정기적으로 만나 도와줘요.",
    category: "education",
    tags: ["멘토링", "무료", "비영리"],
    link: "https://www.kosaf.go.kr/ko/mkinfo.do?pg=PTMKKsSrvMntoringGive_01M",
    org_type: "nonprofit",
    apply_method: "매년 3월경 한국장학재단 홈페이지 또는 학교를 통해 신청해요.",
    apply_link_label: "한국장학재단 사업 안내 보기 ↗",
    apply_steps: [
      { icon: "🏫", title: "학교 안내 확인", subtitle: "또는 재단 홈페이지" },
      { icon: "📝", title: "신청서 제출", subtitle: "3월경 모집" },
      { icon: "🔍", title: "매칭 심사", subtitle: "대학생 멘토 배정" },
      { icon: "🤝", title: "멘토링 시작", subtitle: "정기적으로 만나요" },
    ],
  },
  {
    id: "cf-living-01",
    title: "가족돌봄 아동청소년 통합지원",
    org: "초록우산 어린이재단",
    description:
      "동생을 돌보거나 아픈 가족을 챙기느라 힘든 청소년에게 생활비·교육비·의료비·주거비를 지역별로 최대 100만원까지 지원해줘요.",
    category: "living",
    tags: ["생활비", "가족돌봄청소년", "비영리"],
    link: "https://chorogusan.or.kr",
    org_type: "nonprofit",
    apply_method:
      "개인 온라인 신청보다는 읍면동 주민센터나 학교를 통한 추천으로 진행돼요.",
    apply_link_label: "초록우산 어린이재단 알아보기 ↗",
    apply_steps: [
      { icon: "🧑‍🏫", title: "주민센터·학교 상담", subtitle: "담당자에게 문의" },
      { icon: "📄", title: "추천 진행", subtitle: "초록우산 연계" },
      { icon: "🔍", title: "가정 상황 확인", subtitle: "필요한 지원 파악" },
      { icon: "✅", title: "지원금 지급", subtitle: "최대 100만원" },
    ],
    phone: "1588-1940",
  },
];

export function getProgram(id: string) {
  return programs.find((p) => p.id === id);
}

export function getProgramsByCategory(category: Category) {
  return programs.filter((p) => p.category === category);
}

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  category: string;
  published: boolean;
  created_at: string;
};

export const communityCategories = ["복지정보", "자유수다", "이용후기"];
