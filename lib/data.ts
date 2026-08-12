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
  enrollment_status?: string;
  apply_deadline?: string;
  /** 값이 있으면 이번 회차 모집 종료. 홈의 "지금 신청할 수 있어요"에서 제외되고 이 문구가 배지로 표시된다. */
  reopen_note?: string;
};

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
