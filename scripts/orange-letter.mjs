#!/usr/bin/env node
/**
 * 오렌지레터(소셜섹터 주간 뉴스레터)를 조사팀이 읽을 수 있는 파일로 만든다.
 *
 * 왜 만들었나 (2026.08.25)
 * -----------------------
 * 로드: *"매주 월요일 아침에 오렌지레터라고 소셜섹터 행사 알려주는 데가 있는데
 * 거기서도 뭔가 알 수 있지 않을까 싶어. 혹시 이것도 조사팀한테 알려줄 수 있을까?"*
 *
 * 한 호에 **공모·지원 / 교육·모임 / 행사 / 후원·캠페인**이 마감일과 함께 들어 있고,
 * 기관 이름이 수십 개씩 나온다. 기관 명부를 넓히는 데도, 카드거리를 찾는 데도 좋은 소스다.
 *
 * ⚠️ 왜 손질이 필요한가 — **링크가 전부 로드를 식별하는 추적 주소로 감싸여 있다.**
 *    `event.stibee.com/v2/click/{구독자정보}/{진짜주소}` 꼴이고, 앞 조각에
 *    로드의 구독자 번호가 들어 있다. 그대로 저장소에 넣으면 그게 남는다.
 *    다행히 뒷 조각이 진짜 주소를 base64로 담고 있어서 **풀어서 진짜 주소만 남긴다.**
 *    조사팀에게도 이쪽이 낫다 — 추적 주소는 눌러봐야 어디로 가는지 모른다.
 *
 * 어떻게 쓰나
 *   실장이 Gmail 도구로 오렌지레터 본문을 가져와 파일로 저장한 뒤:
 *     node scripts/orange-letter.mjs <원본파일> <이번호이름>
 *   예: node scripts/orange-letter.mjs /tmp/raw.txt 2026-08-4주
 *
 *   결과: docs/오렌지레터/<이름>.md — 조사팀이 Read로 연다.
 *
 * 매주 월요일 아침에 온다(일요일 밤 발송). 보내는 곳: orangeletter@myorange.io
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [src, name] = process.argv.slice(2);
if (!src || !name) {
  console.log(`쓰는 법: node scripts/orange-letter.mjs <원본파일> <이번호이름>
  예: node scripts/orange-letter.mjs /tmp/raw.txt 2026-08-4주`);
  process.exit(1);
}

const raw = readFileSync(src, "utf-8");

/* 추적 주소를 진짜 주소로 되돌린다.
   https://event.stibee.com/v2/click/{구독자조각}/{주소를 base64url로 담은 조각} */
function unwrap(text) {
  let stripped = 0;
  const out = text.replace(
    /https:\/\/event\.stibee\.com\/v2\/click\/[A-Za-z0-9_-]+\/([A-Za-z0-9_-]+)/g,
    (whole, b64) => {
      try {
        const real = Buffer.from(b64, "base64url").toString("utf-8");
        if (/^https?:\/\//.test(real)) { stripped++; return real; }
      } catch {}
      return "(링크를 못 풀었어요)";
    }
  );
  return { out, stripped };
}

const { out, stripped } = unwrap(raw);

/* 남아 있을지 모르는 구독자 흔적을 한 번 더 지운다 */
const cleaned = out
  .replace(/https:\/\/page\.stibee\.com\/unsubscribe\/\d+\?token=[^\s)|]+/g, "(수신거부 링크 지움)")
  .replace(/[?&]olclid=\d+/g, "")
  .replace(/\|\s*\|/g, "")
  .replace(/\n{3,}/g, "\n\n");

const today = new Date().toISOString().slice(0, 10);
const header = `# 오렌지레터 ${name}

> **조사팀에게** — 소셜섹터 주간 뉴스레터다. 매주 월요일 아침에 온다.
> 실장이 로드 메일함에서 가져와 여기 넣는다. 받은 날: ${today}
>
> **여기서 뭘 찾나**
> - **(공모/지원)** — 마감일이 붙은 지원사업. **청소년이 신청할 수 있는 것**이 있으면 카드 후보다
> - **(교육/모임)·(행사)** — 청소년 대상이면 문화체험·진로 칸 후보
> - **모든 칸에 기관 이름이 수십 개 나온다** — 명부에 없는 곳을 골라 넣어라. 이게 제일 큰 쓸모다
>
> **⚠️ 조심할 것**
> - 이 뉴스레터는 **소셜섹터 종사자(어른)**가 독자다. 대부분이 청소년 대상이 아니다.
>   "채용"은 우리 것이 아니고, 행사도 대부분 실무자용이다. **청소년이 직접 신청할 수 있는지**를 먼저 본다
> - 여기 적힌 마감일을 그대로 믿지 말고 **그 기관 페이지를 열어 확인**한다. 뉴스레터도 옮겨 적은 것이다
> - 링크는 원래 주소로 풀어뒀다(추적 주소 ${stripped}개 정리)

---

`;

mkdirSync("docs/오렌지레터", { recursive: true });
const outPath = `docs/오렌지레터/${name}.md`;
writeFileSync(outPath, header + cleaned);

console.log(`✅ ${outPath}`);
console.log(`   추적 주소 ${stripped}개를 진짜 주소로 풀었어요.`);
console.log(`   조사팀 프롬프트에 이 경로를 넘기세요.`);
