/**
 * 게시된 카드의 문구를 통째로 파일 하나에 뽑는다 → docs/카드전문.md
 *
 * 왜 필요한가 (2026.08.19)
 * -----------------------
 * 부서 에이전트에게는 DB 도구도 Bash도 없다. Read/Grep/Glob/WebFetch/WebSearch뿐이다.
 * 그래서 "카드 42건의 문구가 절대규칙을 지키는지 봐라"라고 시켰더니 CS팀이
 * **0건을 봤다.** WebFetch는 localhost 주소를 못 열고(공인 도메인만 허용),
 * 배포 주소는 자바스크립트로 그려져서 본문이 안 잡힌다.
 *
 * 같은 이유로 리서치팀은 이미 고쳐둔 것을 "고쳐야 한다"고 두 번 보고했다
 * (은뜨락멘토단 카테고리·마인드업 접수방식 — 둘 다 08-15에 이미 처리됨).
 * 자기가 판정하는 대상을 못 보고 검색 결과로만 추측했기 때문이다.
 *
 * 이 파일이 있으면 두 팀 다 Read 한 번으로 전문을 본다.
 *
 * 쓰기: node scripts/cards-dump.mjs
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error(`Supabase 주소와 키가 없어요.

이렇게 채우면 돼요:
  export NEXT_PUBLIC_SUPABASE_URL="https://ssxxqiwlywcgmgkdgmtz.supabase.co"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon 키>"`);
  process.exit(1);
}

const CATEGORY_NAME = {
  education: "교육 📚",
  counseling: "심리상담 💬",
  housing: "주거 🏠",
  living: "경제·생활비 💳",
  career: "진로·취업 🧭",
  culture: "문화체험 🎨",
  contest: "공모전·대회 🏆",
};

const res = await fetch(
  `${url}/rest/v1/programs?status=eq.published&select=*&order=category.asc,id.asc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
if (!res.ok) {
  console.error(`프로그램을 못 읽었어요 (HTTP ${res.status})`);
  process.exit(1);
}
const programs = await res.json();

const today = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push("# 카드 전문 — 청소년이 화면에서 읽는 문구 그대로");
lines.push("");
lines.push("> **이 파일은 기계가 만든다. 손으로 고치지 마세요** — 고쳐도 다음 데일리에 덮어써집니다.");
lines.push("> 카드를 고치려면 실장에게 \"어느 카드의 어느 문구를 이렇게\"라고 보고하세요.");
lines.push(">");
lines.push(`> 만든 날: ${today} · 게시된 카드 ${programs.length}건`);
lines.push(">");
lines.push("> **무엇을 보나** (CLAUDE.md 절대규칙)");
lines.push("> - 낙인 문구 — 저소득층·지원대상자·취약계층·결손가정·차상위계층·수급자");
lines.push("> - 행정용어 — 기준 중위소득 O%, 소득인정액, 가구원, 산정, 선정, 이수, 연계, 의뢰서, 배분신청");
lines.push("> - 말투 — `~합니다`/`~됩니다`/`~을 대상으로` 는 `~해요`로");
lines.push("> - 금액이 있는데 \"물어볼 곳\"이 없는 것");
lines.push("> - `신청 방법`이 \"~할 수 없어요\"로 끝나는 것 (막다른 길)");
lines.push("");

const byCategory = new Map();
for (const p of programs) {
  if (!byCategory.has(p.category)) byCategory.set(p.category, []);
  byCategory.get(p.category).push(p);
}

for (const [cat, list] of byCategory) {
  lines.push(`## ${CATEGORY_NAME[cat] || cat} — ${list.length}건`);
  lines.push("");
  for (const p of list) {
    lines.push(`### ${p.title}`);
    lines.push("");
    lines.push(`- \`${p.id}\` · ${p.org || "(기관 없음)"}`);
    const state =
      p.reopen_note ? `이번 회차 끝남 — ${p.reopen_note}`
      : p.apply_deadline ? `마감 ${p.apply_deadline}`
      : p.enrollment_status || "(접수방식 비어 있음)";
    lines.push(`- 접수: ${state}`);
    lines.push(`- 링크: ${p.link || "(없음)"} (${p.link_kind || "kind 없음"})`);
    if (p.phone) lines.push(`- 전화: ${p.phone}`);
    lines.push(`- 마지막 확인: ${p.last_verified_at || "(없음)"}`);
    lines.push("");
    lines.push("**설명**");
    lines.push("");
    lines.push("> " + String(p.description || "(비어 있음)").replace(/\n/g, "\n> "));
    lines.push("");
    lines.push("**신청 방법**");
    lines.push("");
    lines.push("> " + String(p.apply_method || "(비어 있음)").replace(/\n/g, "\n> "));
    lines.push("");
    if (Array.isArray(p.apply_steps) && p.apply_steps.length) {
      lines.push("**단계**");
      lines.push("");
      for (const s of p.apply_steps) {
        lines.push(`> ${typeof s === "string" ? s : JSON.stringify(s)}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }
}

writeFileSync("docs/카드전문.md", lines.join("\n"));

// 여기서 자동으로 걸리는 것만 세어 준다. 판정은 사람(CS팀)이 한다.
const STIGMA = ["저소득", "대상자", "취약계층", "결손가정", "차상위", "수급자"];
const JARGON = ["중위소득", "소득인정액", "가구원", "산정", "선정", "이수", "연계", "의뢰서", "배분신청"];
// 단계(apply_steps)도 같이 본다. 여기 "대상자 확인" 같은 판정형 라벨이 숨어
// 있었는데 설명·신청방법만 보던 때는 안 걸렸다 (2026.08.19).
const textOf = (p) =>
  `${p.description || ""} ${p.apply_method || ""} ${JSON.stringify(p.apply_steps || "")}`;
const hit = (words) => programs.filter((p) => words.some((w) => textOf(p).includes(w)));
const stigma = hit(STIGMA);
const jargon = hit(JARGON);
const formal = programs.filter((p) => /(합니다|됩니다|을 대상으로|를 대상으로)/.test(textOf(p)));

console.log(`docs/카드전문.md 만들었어요 (${today})`);
console.log(`  게시 ${programs.length}건`);
console.log(`  기계가 걸러낸 것 — 판정은 CS팀이 합니다`);
console.log(`    낙인 문구 의심: ${stigma.length}건${stigma.length ? " — " + stigma.map((p) => p.id).join(", ") : ""}`);
console.log(`    행정용어 의심: ${jargon.length}건${jargon.length ? " — " + jargon.map((p) => p.id).join(", ") : ""}`);
console.log(`    ~합니다체 의심: ${formal.length}건${formal.length ? " — " + formal.map((p) => p.id).join(", ") : ""}`);
