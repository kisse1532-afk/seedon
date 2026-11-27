/**
 * 카드와 학생 설정이 맞는지 — 「나에게 맞는 기회」 목록과 알림 대상 고르기가
 * 같은 규칙을 쓰도록 여기 한 곳에만 둔다.
 *
 * 규칙
 * - 학년: 카드의 대상 학년에 내 학년이 있어야 한다. 대상 학년이 없는 카드는
 *   맞춤 알림 카드가 아니다.
 * - 지역: 카드에 지역이 없으면 전국. 시·군·구까지 있는 카드는 내가 그 시·군·구를
 *   적었을 때만 맞는다(못 쓰는 걸 알리는 것보다 낫다).
 * - 관심 분야: 내가 하나도 안 골랐으면 전부. 골랐으면 겹쳐야 한다.
 * - 교육급여: 거르는 조건이 아니다. 켠 학생에게만 "먼저 뽑는 기회"를 위로 올린다.
 */
import type { Program } from "@/lib/data";

export type AlertCard = Pick<
  Program,
  | "category"
  | "status"
  | "apply_deadline"
  | "reopen_note"
  | "target_grades"
  | "target_regions"
  | "target_interests"
  | "edu_benefit_priority"
>;

export type AlertProfile = {
  grade: string | null;
  sido: string | null;
  sigungu: string | null;
  interests: string[];
};

/** "수원시"와 "수원"을 같게 본다. "중구"처럼 두 글자는 그대로 둔다. */
const place = (word: string) => word.replace(/(?<=..)(시|군|구)$/, "");

function regionMatches(region: string, who: AlertProfile): boolean {
  const [sido, ...rest] = region.trim().split(/\s+/);
  if (sido !== who.sido) return false;
  const mine = (who.sigungu ?? "").split(/\s+/).filter(Boolean).map(place);
  return rest.every((part) => mine.includes(place(part)));
}

/** 지금 신청할 수 있는 맞춤 알림 카드인지. today는 한국 날짜(YYYY-MM-DD). */
export function isOpen(card: AlertCard, today: string): boolean {
  if (card.status && card.status !== "published") return false;
  if (card.reopen_note) return false;
  return !card.apply_deadline || card.apply_deadline >= today;
}

export function matches(card: AlertCard, who: AlertProfile, today: string): boolean {
  if (!isOpen(card, today)) return false;
  if (!who.grade || !card.target_grades?.includes(who.grade)) return false;
  if (card.target_regions?.length && !card.target_regions.some((r) => regionMatches(r, who))) return false;
  if (who.interests.length) {
    const topics = card.target_interests?.length ? card.target_interests : [card.category];
    if (!topics.some((t) => who.interests.includes(t))) return false;
  }
  return true;
}

/**
 * 마감이 가까운 순. 마감일 없는 것은 뒤로.
 * eduBenefit을 켠 학생이면 교육급여를 먼저 뽑는 기회를 맨 위로 올린다.
 */
export function forStudent<T extends AlertCard>(
  cards: T[],
  who: AlertProfile & { eduBenefit: boolean },
  today: string
): T[] {
  const first = (c: T) => (who.eduBenefit && c.edu_benefit_priority ? 0 : 1);
  const due = (c: T) => c.apply_deadline || "9999-99-99";
  return cards
    .filter((c) => matches(c, who, today))
    .sort((a, b) => first(a) - first(b) || due(a).localeCompare(due(b)));
}

/** 마감까지 남은 날 표시. 마감일이 없으면 null. */
export function dDay(deadline: string | null | undefined, today: string): string | null {
  if (!deadline) return null;
  const days = Math.round((Date.parse(deadline) - Date.parse(today)) / 86_400_000);
  if (days < 0) return null;
  return days === 0 ? "오늘 마감" : `D-${days}`;
}
