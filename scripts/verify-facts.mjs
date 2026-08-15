/**
 * 등록된 내용이 공식 페이지에 실제로 있는지 대조한다.
 *
 * 왜 필요한가: 2026-08-15에 딥링크 6건을 파다가, 링크보다 내용이 더 많이
 * 틀려 있는 걸 발견했다. 사업명이 아예 다르거나(세이브더칠드런 "드림세이버"는
 * 사업명이 아니라 코디네이터를 부르는 말이었다), 금액의 근거가 없거나
 * (연 200만원·100만원·300만원), 주최 기관이 틀린 경우(하나금융나눔재단 →
 * 실제는 하나금융그룹)가 나왔다. 원인은 검색 결과 요약을 근거로 등록한 것.
 *
 * 그래서 등록된 제목·금액을 공식 페이지 본문과 기계적으로 대조한다.
 *
 * 쓰는 법:
 *   node scripts/verify-facts.mjs           # 게시된 것 전부
 *   node scripts/verify-facts.mjs edu-01    # 특정 건만
 *
 * ⚠️ 이 도구는 "판정"이 아니라 "사람이 봐야 할 것 좁히기"다.
 * 기관 사이트가 자바스크립트로 그려지면 본문을 못 읽고, 같은 금액도 "300만원"과
 * "300만 원"처럼 표기가 다를 수 있다. "근거 못 찾음"이 곧 "틀렸다"는 아니다.
 * 반대로 여기서 통과했다고 다 맞는 것도 아니다 — 최종 판단은 사람이 한다.
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요해요.");
  process.exit(1);
}

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));

const res = await fetch(
  `${url}/rest/v1/programs?select=id,title,org,description,link,link_kind&status=eq.published&link=not.is.null`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
if (!res.ok) {
  console.error("프로그램 목록을 못 읽었어요:", res.status, await res.text());
  process.exit(1);
}
let programs = await res.json();
if (only.length) programs = programs.filter((p) => only.includes(p.id));

/** 비교하기 쉽게 공백·쉼표·가운뎃점을 지운다. "300만 원" == "300만원" */
const norm = (s) => (s || "").replace(/[\s,·]/g, "");

/** 본문만 남긴다. 스크립트·스타일은 버린다. */
function toText(html) {
  const body = html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return body
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(link) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30_000);
  try {
    const r = await fetch(link, {
      redirect: "follow",
      signal: ac.signal,
      headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
    });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return { text: toText(await r.text()) };
  } catch (e) {
    return { error: String(e?.cause?.code || e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

/** 제목에서 검색에 쓸 만한 낱말만 (2글자 이상, 흔한 꾸밈말 제외) */
const STOP = /^(지원|사업|프로그램|청소년|아동|안내|신청|제\d+회|\d+년|\d+기)$/;
function titleTokens(title) {
  return title
    .replace(/[()（）·\-–—,]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.test(w));
}

/**
 * 우리가 직접 환산해서 쓴 금액. 기관 페이지에는 있을 수가 없으므로 대조에서 뺀다.
 *
 * CLAUDE.md 절대규칙 3에 따라 "기준 중위소득 50%" 같은 행정용어를 청소년이 알아볼
 * 수 있는 실제 금액으로 바꿔 적고 있다(2026년 4인 가구 649만 4,738원 기준
 * → 50% 약 324만원, 100% 약 649만원). 이걸 "근거 없는 금액"으로 잡으면
 * 규칙을 지킨 카드가 매번 걸려서 도구를 아무도 안 믿게 된다.
 * 기준액이 바뀌는 매년 1월에 이 목록도 같이 고칠 것.
 */
const OUR_OWN_MATH = new Set(["324만원", "649만원"]);

/** 설명에 적힌 금액 표기 */
function amounts(text) {
  return [...(text || "").matchAll(/\d[\d,]*\s*만\s*\d*\s*천?\s*원|\d[\d,]*\s*원/g)]
    .map((m) => m[0])
    .filter((a) => norm(a).length >= 4 && !OUR_OWN_MATH.has(norm(a)));
}

const unread = [];
const titleMiss = [];
const amountMiss = [];
const ok = [];

for (const p of programs) {
  const { text, error } = await fetchText(p.link);

  // 본문이 너무 짧으면 자바스크립트로 그려지는 화면이라 대조가 불가능하다.
  if (error || !text || text.length < 400) {
    unread.push({ ...p, why: error || `본문 ${text?.length ?? 0}자` });
    continue;
  }

  const page = norm(text);
  const toks = titleTokens(p.title);
  const hitToks = toks.filter((w) => page.includes(norm(w)));
  const titleOk = toks.length === 0 || hitToks.length / toks.length >= 0.5;

  const amts = amounts(p.description);
  const missAmts = amts.filter((a) => !page.includes(norm(a)));

  if (!titleOk) titleMiss.push({ ...p, toks, hitToks });
  else if (missAmts.length) amountMiss.push({ ...p, missAmts });
  else ok.push(p);
}

function head(t, n, hint) {
  console.log(`\n## ${t} (${n}건)`);
  if (hint) console.log(`   ${hint}`);
}

console.log(`게시 중 ${programs.length}건 대조 (${new Date().toISOString().slice(0, 10)})`);

if (titleMiss.length) {
  head("사업명이 공식 페이지에 안 보임", titleMiss.length,
    "이름이 틀렸을 수 있어요. 세이브더칠드런 \"드림세이버\"가 이 경우였습니다.");
  for (const p of titleMiss)
    console.log(`   - ${p.id} · ${p.title}\n     찾은 낱말: ${p.hitToks.join(", ") || "없음"} / 전체: ${p.toks.join(", ")}\n     ${p.link}`);
}

if (amountMiss.length) {
  head("금액의 근거를 페이지에서 못 찾음", amountMiss.length,
    "틀린 금액은 없는 것보다 나빠요. 확인해서 근거가 없으면 지울 것.");
  for (const p of amountMiss)
    console.log(`   - ${p.id} · ${p.title}\n     못 찾은 금액: ${p.missAmts.join(", ")}\n     ${p.link}`);
}

if (unread.length) {
  head("페이지를 못 읽어 대조 못 함", unread.length,
    "자바스크립트로 그려지거나 방화벽이 막는 사이트. 사람이 브라우저로 확인.");
  for (const p of unread) console.log(`   - ${p.id} · ${p.title} (${p.why})`);
}

console.log(`\n## 대조 통과 ${ok.length}건`);
