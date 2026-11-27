// 공문 → 안내 게시 전 검사 시험
//   node --import ./scripts/lib/ts-alias.mjs scripts/test-notice.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDraft, cleanDraft, hardWords, parseRegions, toProgramRow } from "@/lib/alerts/notice";
import { kstToday, normalizeRegion } from "@/lib/alerts/options";

const TODAY = "2026-11-28";
const good = {
  title: "진로 캠프", org: "OO센터", description: "하루 동안 직업을 체험해요.", who: "경기에 사는 중3이에요.",
  applyMethod: "링크에서 신청해요.", deadline: "2026-12-10", enrollment: "", link: "https://example.org/apply",
  linkKind: "apply", phone: "", category: "career", grades: ["m3"], regions: "경기도, 서울 강남구",
  interests: ["career"], eduBenefitPriority: true, needsRecommendation: false,
};
const errors = (patch) => checkDraft(cleanDraft({ ...good, ...patch }), TODAY);

test("다 채우면 게시할 수 있다", () => assert.deepEqual(errors({}), []));
test("학년을 안 고르면 막는다", () => assert.ok(errors({ grades: [] }).length));
test("모르는 학년 값은 버린다", () => assert.deepEqual(cleanDraft({ grades: ["m1", "x", "m1"] }).grades, ["m1"]));
test("지난 마감일과 없는 날짜는 막는다", () => {
  assert.ok(errors({ deadline: "2026-11-27" }).length);
  assert.ok(errors({ deadline: "2026-02-30" }).length);
  assert.deepEqual(errors({ deadline: TODAY }), []);
});
test("마감일이 없으면 접수 방식이 있어야 한다", () => {
  assert.ok(errors({ deadline: "" }).length);
  assert.deepEqual(errors({ deadline: "", enrollment: "상시 신청" }), []);
});
test("http·javascript 링크는 막는다", () => {
  assert.ok(errors({ link: "http://example.org" }).length);
  assert.ok(errors({ link: "javascript:alert(1)" }).length);
});
test("낙인 말과 중위소득은 막는다", () => {
  for (const word of ["저소득층", "수급자", "차상위", "취약 계층", "기준 중위소득 50%"]) {
    assert.ok(errors({ who: `${word} 학생` }).length, word);
  }
});
test("「게시판」과 「수급자」는 어느 칸에 있어도 게시를 막는다", () => {
  for (const word of ["게시판", "수급자"]) {
    for (const field of ["title", "org", "description", "who", "applyMethod", "phone"]) {
      const found = errors({ [field]: `학교 ${word} 확인` });
      assert.ok(found.some((e) => e.includes(word)), `${field}: ${word}`);
    }
  }
});
test("어려운 행정 말은 알려만 준다", () => {
  const d = cleanDraft({ ...good, applyMethod: "의뢰서를 내요." });
  assert.deepEqual(hardWords(d), ["의뢰서"]);
  assert.deepEqual(checkDraft(d, TODAY), []);
});
test("지역: 별칭을 짧은 이름으로, 못 알아보면 막는다", () => {
  assert.equal(normalizeRegion(" 경기도  수원시 "), "경기 수원시");
  assert.deepEqual(parseRegions("전국"), { regions: [], unknown: [] });
  assert.ok(errors({ regions: "수원" }).length);
});
test("카드 한 줄: 올린 사람은 안 남고, 빈 조건은 null", () => {
  const row = toProgramRow(cleanDraft({ ...good, regions: "", interests: [] }), { id: "alert-x", today: TODAY, uploader: "teacher" });
  assert.equal(row.status, "published");
  assert.equal(row.target_regions, null);
  assert.equal(row.target_interests, null);
  assert.equal(row.enrollment_status, null);
  assert.equal(row.who_text, good.who);
});
test("한국 날짜", () => assert.equal(kstToday(new Date("2026-11-27T20:00:00Z")), "2026-11-28"));
