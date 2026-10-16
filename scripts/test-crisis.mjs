// 위기 신호 시험 대화 — `node --experimental-strip-types scripts/test-crisis.mjs`
// 인계함 2026.10.16 제품 과업 2의 완료 기준("시험 대화로 확인")용.
// 1388 배너가 떠야 하는 말과, 뜨지 않아야 하는 평범한 말을 같이 돌린다.
import { hasCrisisSignal } from "../lib/crisis.ts";

const shouldShow = [
  "요즘 너무 힘들어서 죽고 싶어요",
  "죽고싶다 진짜",
  "아빠가 술 마시면 때려요",
  "어제 집을 나왔는데 잘 곳이 없어요",
  "가출했어요 돈도 없어요",
  "자해를 멈추고 싶어요",
  "그냥 사라지고 싶어",
  "엄마한테 쫓겨났어요",
];
const shouldNot = [
  "학원비가 너무 비싸요",
  "진로를 모르겠어요 뭘 해야 할지",
  "장학금 받고 싶어요",
  "노트북이 필요해요",
  "공모전 나가보고 싶어요",
  "요즘 스트레스가 많아요",
];

let fail = 0;
for (const q of shouldShow) if (!hasCrisisSignal(q)) { fail++; console.log("❌ 1388이 안 뜸:", q); }
for (const q of shouldNot) if (hasCrisisSignal(q)) { fail++; console.log("❌ 괜히 뜸:", q); }
console.log(fail === 0 ? `✅ ${shouldShow.length + shouldNot.length}개 모두 맞음` : `${fail}개 틀림`);
process.exit(fail ? 1 : 0);
