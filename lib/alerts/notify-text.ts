/**
 * 남이 볼 수 있는 알림 문구 — 알림함, (나중에) 잠금화면 알림, 링크 미리보기.
 *
 * 제목은 늘 같고 본문은 카드 이름뿐이다. 카드 이름 자체에 집안 사정이 드러나는
 * 말이 있으면 이름도 빼고 중립 문구로 바꾼다.
 */

export const NOTIFICATION_TITLE = "새 기회가 있어요";

const REVEALING = /교육\s*급여|소득|수급|차상위|취약\s*계층|급식\s*카드|한부모|기초\s*생활|지원\s*대상/;

export function notificationBody(cardTitle: string): string {
  const title = cardTitle.trim();
  return !title || REVEALING.test(title) ? "씨드온에서 확인해보세요" : title;
}
