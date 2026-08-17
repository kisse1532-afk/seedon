export type Category =
  | "education"
  | "counseling"
  | "housing"
  | "living"
  | "career"
  | "culture"
  | "contest";

export const categories: { slug: Category; label: string; emoji: string }[] = [
  { slug: "education", label: "교육", emoji: "📚" },
  { slug: "counseling", label: "심리상담", emoji: "💬" },
  { slug: "housing", label: "주거", emoji: "🏠" },
  { slug: "living", label: "경제·생활비", emoji: "💳" },
  { slug: "career", label: "진로·취업", emoji: "🧭" },
  { slug: "culture", label: "문화체험", emoji: "🎨" },
  // 2026-08-15 신설. 지금까지 등록된 게 전부 "힘들 때 받는 것"이라, 문구를
  // 아무리 다듬어도 "여기는 사정 어려운 애들 오는 데"라는 인상이 남는다.
  // 해볼 만한 기회가 같이 있어야 그냥 "청소년이 쓰는 데"가 된다.
  { slug: "contest", label: "공모전·대회", emoji: "🏆" },
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
  /**
   * 링크가 어떤 페이지인지.
   * 'apply' = 그 페이지에 신청·상세 안내가 있음
   * 'info'  = 기관 대문·포털이라 들어가서 더 찾아야 함
   * 둘을 구분하지 않고 다 "신청하기"로 보여주면, 눌러본 청소년이 재단 홈에
   * 떨어져 처음부터 다시 찾게 된다(2026-08-15 로드 지적).
   */
  link_kind?: "apply" | "info";
  apply_steps?: ApplyStep[];
  phone?: string;
  last_verified_at?: string;
  enrollment_status?: string;
  apply_deadline?: string;
  /** 값이 있으면 이번 회차 모집 종료. 홈의 "지금 신청할 수 있어요"에서 제외되고 이 문구가 배지로 표시된다. */
  reopen_note?: string;
  /**
   * 게시 상태. 목록 쿼리는 published만 가져오므로 대부분의 화면에서는 볼 일이 없지만,
   * 북마크처럼 "예전에 저장해둔 것"을 다시 꺼내는 화면에서는 그 사이 내려간 카드가
   * 섞여 나온다. 그때 멀쩡한 것처럼 보여주면 청소년이 헛걸음한다.
   */
  status?: "published" | "pending" | "rejected";
};

/**
 * 저장해둔 카드를 다시 꺼낼 때, 지금도 신청할 수 있는지 알려주는 한마디.
 * 신청 가능하면 null.
 */
export function getClosedNotice(
  program: Pick<Program, "status" | "apply_deadline">,
  today = new Date().toISOString().slice(0, 10)
): string | null {
  if (program.status && program.status !== "published") {
    return "지금은 안내를 내려둔 프로그램이에요";
  }
  if (program.apply_deadline && program.apply_deadline < today) {
    return "이번 모집은 끝났어요";
  }
  return null;
}

// 카드 배지에 쓸 접수상태 문구를 계산한다.
// 마감일이 지난 프로그램은 조회 쿼리 단계에서 이미 걸러지므로, 여기서는
// "곧 마감"인지만 판단하면 된다.
export function getEnrollmentBadgeLabel(
  program: Pick<Program, "apply_deadline" | "enrollment_status" | "reopen_note">
): string | undefined {
  // 이번 회차가 끝난 프로그램은 마감일·상시모집보다 "다음 모집 안내"를 우선 보여준다.
  if (program.reopen_note) return program.reopen_note;

  if (program.apply_deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(program.apply_deadline);
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= 7) {
      return daysLeft === 0 ? "오늘 마감" : `마감 D-${daysLeft}`;
    }
  }
  return program.enrollment_status;
}

// 마감일이 없는 프로그램의 접수 방식. enrollment_status에 이 셋 중 하나가 들어간다.
// "상시모집" 하나로 뭉뚱그리면 꿈길(체험처 찾는 사이트)처럼 애초에 모집을 안 하는 것까지
// 모집 중인 것처럼 보이게 되므로 셋으로 나눈다.
export const ENROLLMENT_STATUSES = ["상시 신청", "언제든 이용", "기관 통해 신청"] as const;

// 위 상태별로 홈 목록 도장에 찍을 짧은 문구.
const ALWAYS_STAMP_CAPTION: Record<string, string> = {
  "상시 신청": "신청",
  "언제든 이용": "이용",
  "기관 통해 신청": "기관 통해",
};

// 홈 목록 왼쪽에 세우는 날짜 도장. 마감일이 없으면 "상시", 있으면 D-day로 보여준다.
export type DeadlineStamp = {
  label: string;
  caption: string;
  tone: "always" | "soon" | "normal";
};

export function getDeadlineStamp(
  program: Pick<Program, "apply_deadline" | "enrollment_status">
): DeadlineStamp {
  if (!program.apply_deadline) {
    // 접수 방식이 확인된 것만 그 문구를 쓴다. 확인 안 된 건 "모집 중"이라고
    // 단정하지 않고 "안내"로 둔다 (거짓 정보로 청소년을 움직이게 하지 않기 위함).
    const caption = ALWAYS_STAMP_CAPTION[program.enrollment_status ?? ""] ?? "안내";
    return { label: "상시", caption, tone: "always" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(program.apply_deadline);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const caption = `${deadline.getMonth() + 1}/${deadline.getDate()} 마감`;

  if (daysLeft <= 0) return { label: "오늘", caption, tone: "soon" };
  return {
    label: `D-${daysLeft}`,
    caption,
    tone: daysLeft <= 7 ? "soon" : "normal",
  };
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

/**
 * 긴급 연락처.
 *
 * 홈과 심리상담 화면이 각각 따로 목록을 들고 있어서, 심리상담에는 4개인데
 * 홈에는 1366(여성긴급전화)이 빠진 3개만 나오고 있었다(2026.08.15 로드 지적).
 * 목숨이 걸릴 수도 있는 번호가 화면마다 다르면 안 되므로 한 곳에 모은다.
 * 번호를 더하거나 뺄 땐 여기만 고치면 두 화면에 같이 반영된다.
 *
 * head/tail로 나눈 건 "1577-0199"에서 국번만 크게 보이게 하려는 것.
 * desc를 두 줄로 나눠 둔 건 칸이 옆으로 퍼지지 않게 하려는 것 — 한 줄로
 * 흘리면 칸 폭이 글자 길이만큼 벌어진다.
 */
/**
 * 긴급 연락처. 홈·심리상담 배너·푸터가 **전부 여기서 가져온다.**
 * 화면마다 목록을 따로 들고 있으면 반드시 어긋난다 — 실제로 푸터에만
 * 여성긴급전화(1366)가 빠져 3개만 보이고 있었다(2026.08.17 로드 지적).
 *
 * `short`는 푸터처럼 좁은 자리에서 쓰는 짧은 이름이다.
 */
export const emergencyContacts = [
  { number: "1388", short: "청소년전화", name: "청소년전화", desc: ["무슨 얘기든", "24시간"] },
  { number: "1577-0199", short: "위기상담", name: "마음이 힘들 때", desc: ["정신건강", "위기상담"] },
  { number: "1366", short: "여성긴급전화", name: "폭력·위험할 때", desc: ["여성긴급전화", "24시간"] },
  { number: "117", short: "학교폭력", name: "학교폭력", desc: ["신고하고", "상담받기"] },
];
