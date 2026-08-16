/**
 * 누가 쓰는 계정인지.
 *
 * 로드 결정(2026-08-16): 학생용과 선생님·보호자용을 나눈다.
 *
 * 왜 필요한가: 등록된 프로그램 상당수가 "선생님한테 말해보세요"로 시작한다.
 * 곁에 있는 어른이 대신 찾아보는 건 원래 있던 쓰임인데, 지금은 둘을 구분하지
 * 않아서 파일럿 지표("청소년이 카드를 보고 신청까지 갔나")에 어른 트래픽이
 * 그대로 섞인다. 나눠야 청소년 전환율을 제대로 볼 수 있다.
 *
 * 나누되 넘지 않을 선: 어른이 청소년 대신 신청하는 기능은 만들지 않는다.
 * 씨드온의 역할은 정보와 접근 장벽을 없애는 데까지다(스코프 원칙). 어른 계정도
 * "청소년에게 알려주기 위해 찾아보는 것"까지다.
 */

export type Role = "youth" | "adult";

/** 어른이 어떤 입장인지. 청소년에게 어떻게 전달할지가 달라진다. */
export const ADULT_KINDS = [
  "학교 선생님",
  "부모님·보호자",
  "상담사·사회복지사",
  "그 밖에 청소년 곁에 있는 사람",
] as const;

export type AdultKind = (typeof ADULT_KINDS)[number];

/**
 * 이 계정이 회원 정보를 아직 안 채웠는지.
 *
 * 처음엔 회원 정보를 가입 흐름 안에만 넣었는데, 그러면 이미 계정이 있는
 * 사람은 로그인해도 그 화면을 영영 못 만난다(2026-08-16 로드 확인).
 * 로그인할 때마다 확인해서 안 채웠으면 채우게 한다.
 */
export function needsOnboarding(profile: { role?: string | null; birth_year?: number | null } | null): boolean {
  if (!profile) return true;
  if (!profile.role) return true;
  // 청소년은 몇 년생인지가 있어야 한다(만 14세 확인). 어른은 안 받는다.
  if (profile.role === "youth" && !profile.birth_year) return true;
  return false;
}
