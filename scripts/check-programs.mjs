/**
 * 등록된 프로그램이 지금도 맞는 정보인지 점검한다.
 *
 * 왜 필요한가: 공모전·대회를 등록하기 시작하면 마감이 짧고 계속 쏟아져서,
 * 사람이 눈으로 관리하면 지난 공모전이 그대로 남는다. 로드 지적(2026-08-15)
 * "그건 에이전트 코딩을 열심히 하면 되는 거 아니야?" — 맞는 말이라 자동화한다.
 *
 * 쓰는 법:
 *   node scripts/check-programs.mjs           # 점검만
 *   node scripts/check-programs.mjs --fix     # 마감 지난 것 자동 정리까지
 *
 * 필요한 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   --fix를 쓰려면 쓰기 권한이 있는 키(SUPABASE_SERVICE_ROLE_KEY)가 필요하다.
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

const envLib = await import("./lib/env.mjs");
const { url, key: readKey } = envLib.requireSupabase();
const writeKey = envLib.writeKey(readKey);
const fix = process.argv.includes("--fix");
const today = new Date().toISOString().slice(0, 10);

async function api(path, init = {}) {
  const key = init.method && init.method !== "GET" ? writeKey : readKey;
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

const programs = await api("programs?select=*&status=eq.published");

/* ── 1. 마감이 지났는데 아직 게시 중인 것 ────────────────────────────────
   홈 목록은 쿼리에서 이미 걸러내지만, 상태가 published로 남아 있으면
   관리자 화면에서 "게시중"으로 잡혀 실제와 어긋난다. reopen_note를 채워
   "다음 회차 안내"로 바꿔준다. */
const expired = programs.filter(
  (p) => p.apply_deadline && p.apply_deadline < today && !p.reopen_note
);

/* ── 2. 청소년이 아닌 대상이 섞여 들어온 것 ──────────────────────────────
   공모전 사이트에는 대학생·일반 대상이 같이 올라온다. 제목·설명에 청소년이
   아닌 대상만 적혀 있으면 잡아낸다. 확실히 걸러내는 게 아니라 "사람이 봐야 할
   것"을 줄여주는 용도다 — 애매한 건 사람이 판단해야 한다. */
const ADULT_ONLY = /대학생|대학원|성인|직장인|만\s*19세\s*이상|19세\s*이상|청년\s*\(?만?\s*19/;
// "중3~대학생"처럼 청소년이 함께 들어가는 표기가 많아서, 학년 표기(중1·고2 등)와
// 나이 범위 아래끝(만 9~24세)까지 청소년 신호로 본다. 이걸 빼면 멀쩡한 사업이
// 계속 걸려 사람이 매번 헛걸음한다.
const YOUTH =
  /청소년|중학생|고등학생|초중고|중·고|중고생|중\s*[1-3]|고\s*[1-3]|만\s*[9]~|만\s*1[0-8]|1[4-8]세/;
const ageSuspect = programs.filter((p) => {
  const text = `${p.title} ${p.description}`;
  return ADULT_ONLY.test(text) && !YOUTH.test(text);
});

/* ── 3. 접수 방식이 비어 홈 목록에서 아예 빠지는 것 ─────────────────────── */
const noEnrollment = programs.filter(
  (p) => !p.enrollment_status && !p.apply_deadline && !p.reopen_note
);

/* ── 4. 링크가 기관 대문이라 딥링크로 바꿔야 하는 것 ─────────────────────── */
const infoLinks = programs.filter((p) => p.link_kind === "info");

/* ── 5. 금액이 적힌 카드 ──────────────────────────────────────────────────
   2026-08-15에 공식 페이지에 근거가 없는 금액이 두 건 나왔다("1년 최대 200만원",
   "연 300만원"). 틀린 금액은 없는 것보다 나쁘다 — 청소년이 그 숫자를 보고
   움직이기 때문이다. 숫자가 적힌 카드를 모아 보여주고, 근거를 확인했는지
   되짚게 한다. 매년 1월 기준 중위소득이 바뀔 때 전수 갱신할 목록이기도 하다. */
const MONEY = /\d[\d,]*\s*(만원|만\s*\d*천원|억|원\b)/;
const withMoney = programs.filter((p) => MONEY.test(`${p.description} ${p.apply_method ?? ""}`));

/* ── 6. 확인 못 했다고 적어놓고 숫자가 들어간 카드 ────────────────────────
   2026-08-15 저녁 로드 결정으로 "찾았으면 바로 게시"가 기본값이 됐다. 페이지를
   못 열어도 올리되 **숫자만 뺀다**는 게 그 방침의 유일한 안전벨트다. 그래서
   review_note에 "확인 못 함"이라고 적어놓고 정작 설명에는 금액이 들어가 있는
   카드를 잡아낸다. 이게 그대로 나가면 청소년이 근거 없는 숫자를 보고 움직인다.

   전화번호·주소의 숫자는 금액이 아니므로 제외하고, 우리가 규칙대로 환산해 쓴
   중위소득 금액도 뺀다(CLAUDE.md 절대규칙 3). */
const UNVERIFIED = /확인\s*못|확인이?\s*안|미확인|확인\s*필요|403|연결\s*실패|자바스크립트/;
const OUR_OWN_MATH = /(324|649|974)\s*만원/g;
const unverifiedWithMoney = programs.filter((p) => {
  if (!UNVERIFIED.test(p.review_note || "")) return false;
  const text = `${p.description} ${p.apply_method ?? ""}`.replace(OUR_OWN_MATH, " ");
  return MONEY.test(text);
});

function report(title, rows, hint) {
  if (rows.length === 0) return;
  console.log(`\n## ${title} (${rows.length}건)`);
  if (hint) console.log(`   ${hint}`);
  for (const p of rows) console.log(`   - ${p.id} · ${p.title}`);
}

console.log(`게시 중 ${programs.length}건 점검 (${today})`);
report("마감이 지났는데 게시 중", expired, fix ? "→ 아래에서 자동 정리합니다." : "--fix 를 붙이면 자동 정리합니다.");
report("청소년 대상이 아닐 수 있음", ageSuspect, "제목·설명에 대학생·성인만 보여요. 확인해서 아니면 내릴 것.");
report("접수 방식 미입력 — 홈에 안 보임", noEnrollment, "상시/기간 중 무엇인지 확인해 채울 것.");
report("링크가 기관 대문 — 딥링크로 교체 필요", infoLinks, "그 사업 페이지를 찾아 link를 바꾸고 link_kind='apply'로.");
report("⚠️ 확인 못 했다면서 숫자가 적혀 있음 — 지금 빼야 함", unverifiedWithMoney,
  "\"찾았으면 바로 올린다\"의 유일한 안전벨트가 이겁니다. 공식 페이지에서 그 숫자를 직접 보지 못했으면 지우고 \"그해 공고에서 확인하세요\"로 바꿀 것.");
report("금액이 적힌 카드 — 공식 페이지에 그 숫자가 있는지 확인", withMoney, "근거 없는 금액은 없는 것보다 나빠요. 매년 1월 기준액 갱신 때도 이 목록을 봅니다.");

if (fix && expired.length > 0) {
  for (const p of expired) {
    await api(`programs?id=eq.${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        reopen_note: "올해 접수 마감 · 다음 모집 공고 확인",
        review_note: `${p.review_note ? p.review_note + " / " : ""}${today} 마감일(${p.apply_deadline}) 경과 자동 확인 — 다음 회차 안내로 전환`,
      }),
    });
    console.log(`   정리함: ${p.id}`);
  }
}

if (expired.length + ageSuspect.length + noEnrollment.length + infoLinks.length + unverifiedWithMoney.length === 0) {
  console.log("\n손볼 게 없어요.");
}
