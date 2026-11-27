/**
 * 누구에게 언제 알림을 만들지. DB는 AlertStore로 받아서 시험할 수 있게 한다
 * (실제 구현은 lib/alerts/notify.ts).
 *
 * 규칙
 * - 마감일이 있고 지금 신청할 수 있는 맞춤 알림 카드만.
 * - 게시됐을 때 한 번(new).
 * - 마감 3일 전에 한 번 더(deadline). 신청 버튼을 누른 학생은 뺀다.
 *   하루 작업이 빠졌을 수 있어 마감 2일 전·1일 전에도 아직 안 보냈으면 보낸다.
 * - 마감 3일 전 이후에 new를 받은 학생에게는 다시 보내지 않는다(연달아 두 번 방지).
 * - 같은 학생·카드·종류는 DB의 unique 조건이 한 번으로 막는다.
 */
import type { Program } from "@/lib/data";
import { isOpen, type AlertCard } from "@/lib/alerts/match";
import { kstToday } from "@/lib/alerts/options";

export const REMIND_DAYS = 3;

export type NotifyCard = AlertCard & Pick<Program, "id">;
export type NotificationRow = { user_id: string; program_id: string; kind: "new" | "deadline" };

export type AlertStore = {
  /** 카드 조건에 맞는 학생 */
  matchingIds(card: NotifyCard): Promise<string[]>;
  /** 그중 이 카드의 신청 버튼을 눌렀거나 관심 등록한 학생 */
  appliedIds(programId: string, userIds: string[]): Promise<Set<string>>;
  /** 그중 new 알림을 받은 학생 → 받은 날(한국 날짜) */
  newAlertDates(programId: string, userIds: string[]): Promise<Map<string, string>>;
  /** 이미 있는 줄은 건너뛰고, 새로 만든 개수를 돌려준다 */
  insert(rows: NotificationRow[]): Promise<number>;
};

const DAY = 86_400_000;
export const daysUntil = (deadline: string, today: string) =>
  Math.round((Date.parse(deadline) - Date.parse(today)) / DAY);

export function reminderDue(deadline: string | null | undefined, today: string): boolean {
  if (!deadline) return false;
  const left = daysUntil(deadline, today);
  return left >= 1 && left <= REMIND_DAYS;
}

/** 마감 알림을 보내기 시작하는 날(마감 3일 전). */
export const reminderStart = (deadline: string) =>
  new Date(Date.parse(deadline) - REMIND_DAYS * DAY).toISOString().slice(0, 10);

const canAlert = (card: NotifyCard, today: string) => Boolean(card.apply_deadline) && isOpen(card, today);

export async function sendNew(store: AlertStore, card: NotifyCard, today = kstToday()): Promise<number> {
  if (!canAlert(card, today)) return 0;
  const ids = await store.matchingIds(card);
  if (!ids.length) return 0;
  return store.insert(ids.map((user_id) => ({ user_id, program_id: card.id, kind: "new" as const })));
}

export async function sendReminder(store: AlertStore, card: NotifyCard, today = kstToday()): Promise<number> {
  if (!canAlert(card, today) || !reminderDue(card.apply_deadline, today)) return 0;
  const ids = await store.matchingIds(card);
  if (!ids.length) return 0;
  const applied = await store.appliedIds(card.id, ids);
  const sent = await store.newAlertDates(card.id, ids);
  const start = reminderStart(card.apply_deadline!);
  const rows = ids
    .filter((id) => !applied.has(id) && !((sent.get(id) ?? "") >= start))
    .map((user_id) => ({ user_id, program_id: card.id, kind: "deadline" as const }));
  return rows.length ? store.insert(rows) : 0;
}
