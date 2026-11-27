// 「나에게 맞는 기회」·알림 대상 규칙 시험
//   node --import ./scripts/lib/ts-alias.mjs scripts/test-match.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { dDay, forStudent, isOpen, matches } from "@/lib/alerts/match";

const TODAY = "2026-11-28";
const card = (patch = {}) => ({ category: "career", status: "published", target_grades: ["m3", "h1"], ...patch });
const me = (patch = {}) => ({ grade: "m3", sido: "경기", sigungu: null, interests: [], ...patch });
const yes = (c, w) => matches(card(c), me(w), TODAY);

test("학년", () => {
  assert.ok(yes({}, {}));
  assert.ok(!yes({}, { grade: "h3" }));
  assert.ok(!yes({}, { grade: null }));
  assert.ok(!yes({ target_grades: null }, {}), "맞춤 알림 카드가 아니면 안 맞는다");
});
test("마감·게시 상태", () => {
  assert.ok(yes({ apply_deadline: TODAY }, {}));
  assert.ok(!yes({ apply_deadline: "2026-11-27" }, {}));
  assert.ok(!yes({ status: "pending" }, {}));
  assert.ok(!yes({ reopen_note: "내년 3월" }, {}));
  assert.ok(isOpen(card(), TODAY));
});
test("지역", () => {
  assert.ok(yes({ target_regions: null }, { sido: null }), "전국");
  assert.ok(yes({ target_regions: ["서울", "경기"] }, {}));
  assert.ok(!yes({ target_regions: ["서울"] }, {}));
  assert.ok(!yes({ target_regions: ["경기"] }, { sido: null }));
  assert.ok(!yes({ target_regions: ["경기 수원시"] }, {}), "시·군·구를 안 적으면 동네 한정은 제외");
  assert.ok(yes({ target_regions: ["경기 수원시"] }, { sigungu: "수원" }));
  assert.ok(yes({ target_regions: ["경기 수원시"] }, { sigungu: "수원시 영통구" }));
  assert.ok(!yes({ target_regions: ["경기 수원시"] }, { sigungu: "성남시" }));
  assert.ok(!yes({ target_regions: ["서울 중구"] }, { sido: "서울", sigungu: "중랑구" }));
});
test("관심 분야", () => {
  assert.ok(yes({}, { interests: ["career", "culture"] }));
  assert.ok(!yes({}, { interests: ["culture"] }));
  assert.ok(yes({ target_interests: ["culture"] }, { interests: ["culture"] }));
  assert.ok(!yes({ target_interests: ["culture"] }, { interests: ["career"] }));
});
test("순서: 마감 임박 순, 마감 없는 것은 뒤", () => {
  const cards = [
    card({ id: "none" }),
    card({ id: "late", apply_deadline: "2026-12-20" }),
    card({ id: "edu", apply_deadline: "2026-12-30", edu_benefit_priority: true }),
    card({ id: "soon", apply_deadline: "2026-11-30" }),
  ];
  const order = (eduBenefit) => forStudent(cards, { ...me(), eduBenefit }, TODAY).map((c) => c.id);
  assert.deepEqual(order(false), ["soon", "late", "edu", "none"]);
  assert.deepEqual(order(true), ["edu", "soon", "late", "none"]);
});
test("D-day", () => {
  assert.equal(dDay("2026-12-01", TODAY), "D-3");
  assert.equal(dDay(TODAY, TODAY), "오늘 마감");
  assert.equal(dDay(null, TODAY), null);
  assert.equal(dDay("2026-11-01", TODAY), null);
});
