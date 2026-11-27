/**
 * 어른에게 보내는 안내. 카드 내용만으로 만든다 — 학생 정보를 받는 자리가 없어야
 * 교육급여 선택 같은 설정이 새어 나갈 수 없다.
 */
import type { Program } from "@/lib/data";
import { notificationBody } from "@/lib/alerts/notify-text";

type Card = Pick<
  Program,
  "title" | "link" | "status" | "needs_recommendation" | "target_grades" | "apply_deadline" | "reopen_note"
>;

/** 보내기 버튼과 공유 화면을 여는 카드인지. */
export function isShareable(card: Card): boolean {
  return Boolean(
    (!card.status || card.status === "published") && card.needs_recommendation && card.target_grades?.length
  );
}

export function shareClosed(card: Card, today: string): boolean {
  return Boolean(card.reopen_note || (card.apply_deadline && card.apply_deadline < today));
}

/** 메신저에 붙일 글. 씨드온 안내 링크는 화면에서 뒤에 붙인다. */
export function shareMessage(card: Card): string {
  return [
    "선생님, 신청해보고 싶은 기회가 있는데 추천이 필요하대요. 한 번 봐주실 수 있어요?",
    notificationBody(card.title),
    ...(card.link ? [`공식 안내: ${card.link}`] : []),
    "쉬운 안내:",
  ].join("\n");
}
