// 알림 대상·마감 알림 시점·문구 시험
//   node --import ./scripts/lib/ts-alias.mjs scripts/test-notify.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { matches } from "@/lib/alerts/match";
import { reminderDue, reminderStart, sendNew, sendReminder } from "@/lib/alerts/notify-core";
import { NOTIFICATION_TITLE, notificationBody } from "@/lib/alerts/notify-text";
import { isShareable, shareClosed, shareMessage } from "@/lib/alerts/share";

const DEADLINE = "2026-12-10";
const card = (patch = {}) => ({
  id: "c1",
  title: "청소년 영상 캠프",
  link: "https://example.org/apply",
  category: "career",
  status: "published",
  target_grades: ["m3"],
  apply_deadline: DEADLINE,
  needs_recommendation: true,
  ...patch,
});
const who = (grade, interests = []) => ({ grade, sido: "경기", sigungu: null, interests });
const STUDENTS = { a: who("m3"), b: who("m3"), other: who("h1"), culture: who("m3", ["culture"]) };

/** DB 대신 메모리. 대상은 진짜 맞춤 규칙(matches)으로 고른다. */
function memory(today, { applied = [] } = {}) {
  const rows = [];
  const day = { value: today };
  return {
    rows,
    day,
    matchingIds: async (c) => Object.keys(STUDENTS).filter((id) => matches(c, STUDENTS[id], day.value)),
    appliedIds: async (_program, ids) => new Set(ids.filter((id) => applied.includes(id))),
    newAlertDates: async (program, ids) =>
      new Map(
        rows
          .filter((r) => r.program_id === program && r.kind === "new" && ids.includes(r.user_id))
          .map((r) => [r.user_id, r.day])
      ),
    insert: async (list) => {
      const fresh = list.filter(
        (n) => !rows.some((r) => r.user_id === n.user_id && r.program_id === n.program_id && r.kind === n.kind)
      );
      rows.push(...fresh.map((r) => ({ ...r, day: day.value })));
      return fresh.length;
    },
  };
}
const got = (store, kind) => store.rows.filter((r) => r.kind === kind).map((r) => r.user_id).sort();

test("게시 알림: 조건이 맞는 학생에게 한 번만", async () => {
  const store = memory("2026-12-01");
  assert.equal(await sendNew(store, card(), "2026-12-01"), 2);
  assert.equal(await sendNew(store, card(), "2026-12-01"), 0);
  assert.deepEqual(got(store, "new"), ["a", "b"]);
});

test("게시 알림: 마감일 없음·게시 전·마감 지남이면 안 보낸다", async () => {
  for (const patch of [
    { apply_deadline: null },
    { status: "pending" },
    { apply_deadline: "2026-11-30" },
    { reopen_note: "내년 3월" },
    { target_grades: null },
  ]) {
    const store = memory("2026-12-01");
    assert.equal(await sendNew(store, card(patch), "2026-12-01"), 0, JSON.stringify(patch));
    assert.equal(await sendReminder(store, card(patch), "2026-12-01"), 0, JSON.stringify(patch));
  }
});

test("마감 알림 시점: 3일 전부터 하루 전까지", () => {
  const due = (today) => reminderDue(DEADLINE, today);
  assert.equal(due("2026-12-06"), false, "4일 전");
  assert.equal(due("2026-12-07"), true, "3일 전");
  assert.equal(due("2026-12-09"), true, "하루 전(빠진 날 챙기기)");
  assert.equal(due(DEADLINE), false, "마감 당일");
  assert.equal(due("2026-12-11"), false);
  assert.equal(reminderDue(null, "2026-12-07"), false);
  assert.equal(reminderStart("2027-01-02"), "2026-12-30");
});

test("마감 알림: 신청 누른 학생은 빼고, 여러 날 돌아도 한 번", async () => {
  const store = memory("2026-12-01", { applied: ["a"] });
  await sendNew(store, card(), "2026-12-01");
  for (const day of ["2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09"]) {
    store.day.value = day;
    await sendReminder(store, card(), day);
  }
  assert.deepEqual(got(store, "deadline"), ["b"]);
  assert.equal(store.rows.find((r) => r.kind === "deadline").day, "2026-12-07");
});

test("마감 알림: 3일 전 이후에 게시되면 연달아 두 번 보내지 않는다", async () => {
  const store = memory("2026-12-07");
  await sendNew(store, card(), "2026-12-07");
  store.day.value = "2026-12-08";
  assert.equal(await sendReminder(store, card(), "2026-12-08"), 0);
});

test("마감 알림: 게시 알림을 못 받았던 맞는 학생에게도 보낸다", async () => {
  const store = memory("2026-12-07");
  assert.equal(await sendReminder(store, card(), "2026-12-07"), 2);
});

test("문구: 제목은 늘 같고 본문은 카드 이름뿐", () => {
  assert.equal(NOTIFICATION_TITLE, "새 기회가 있어요");
  assert.equal(notificationBody(" 청소년 영상 캠프 "), "청소년 영상 캠프");
});

test("문구: 카드 이름에 집안 사정이 드러나면 이름도 숨긴다", () => {
  for (const title of ["교육급여 학생 캠프", "교육 급여 바우처", "저소득 장학금", "중위소득 50% 지원", "수급 가정 캠프", "한부모 지원"]) {
    assert.equal(notificationBody(title), "씨드온에서 확인해보세요", title);
  }
});

test("어른에게 보내는 안내: 추천이 필요한 게시 카드만, 학생 설정은 들어갈 자리가 없다", () => {
  assert.ok(isShareable(card()));
  assert.ok(!isShareable(card({ needs_recommendation: false })));
  assert.ok(!isShareable(card({ status: "rejected" })));
  assert.ok(!isShareable(card({ target_grades: null })));
  assert.ok(shareClosed(card(), "2026-12-11"));
  assert.ok(!shareClosed(card(), DEADLINE));

  const message = shareMessage(card({ edu_benefit_priority: true }));
  assert.ok(message.includes("https://example.org/apply"));
  assert.ok(!/교육급여|소득|수급/.test(message));
  assert.equal(message, shareMessage(card({ edu_benefit_priority: false })));
});
