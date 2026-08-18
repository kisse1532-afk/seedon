/**
 * 부서가 일 시작할 때 읽는 "지금 상태"를 자동으로 만든다 → docs/team-now.md
 *
 * 왜 만들었나 (2026.08.18)
 * 부서 에이전트는 매번 아무것도 모르는 상태로 시작한다. 그래서 오늘 사업운영팀이
 * "관심 등록 폼이 화면에 없다"를 최대 발견으로 올렸는데, 그건 버그가 아니라
 * **어제 로드가 직접 지시해서 뺀 것**이었다. 실장이 커밋을 열어보고서야 걸러냈다.
 * 이런 헛제안은 부서 잘못이 아니라 구조 잘못이다 — 어제 무슨 일이 있었는지
 * 알 방법을 안 줬으니까.
 *
 * team-context.md는 사람이 손으로 고치는 파일이라 반드시 낡는다(실제로 이틀 만에
 * 숫자가 다 틀렸다). 그래서 낡을 수 없는 파일을 따로 만든다. 이건 손대지 말고
 * 데일리마다 이 스크립트를 다시 돌려라.
 *
 * 쓰는 법:  node scripts/team-brief.mjs
 * 필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const envLib = await import("./lib/env.mjs");
const { url, key } = envLib.requireSupabase();

async function q(path) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const total = (r.headers.get("content-range") || "").split("/")[1];
  return { rows: await r.json(), count: total === "*" ? null : Number(total) };
}

const CAT_NAME = {
  education: "교육", counseling: "심리상담", housing: "주거", living: "경제·생활비",
  career: "진로·취업", culture: "문화체험", contest: "공모전·대회",
};

const today = new Date().toISOString().slice(0, 10);

// ── 지금 숫자 ────────────────────────────────────────────────
const published = await q("programs?status=eq.published&select=id,category");
const byCat = {};
for (const p of published.rows) byCat[p.category] = (byCat[p.category] || 0) + 1;
const catLine = Object.entries(CAT_NAME)
  .map(([k, name]) => [name, byCat[k] || 0])
  .sort((a, b) => b[1] - a[1]);

const tables = ["applications", "help_requests", "bookmarks", "program_reviews", "community_posts"];
const counts = {};
for (const t of tables) {
  try {
    const c = (await q(`${t}?select=id&limit=1`)).count;
    // 권한(RLS)에 막혀 못 세는 표가 있다. 0으로 적으면 "아무도 안 썼다"는
    // 거짓말이 되므로 못 센 건 못 셌다고 그대로 적는다.
    counts[t] = typeof c === "number" ? `${c}건` : "못 셈 (권한)";
  } catch { counts[t] = "못 셈 (권한)"; }
}

// ── 이미 한 일 ───────────────────────────────────────────────
let commits = "";
try {
  commits = execSync('git log --since="14 days ago" --pretty=format:"%ad  %s" --date=short', {
    encoding: "utf-8", maxBuffer: 1024 * 1024,
  }).trim();
} catch { commits = "(git 기록을 못 읽었어요)"; }

const thin = catLine.filter(([, n]) => n <= 3).map(([name, n]) => `${name} ${n}건`);

// ── 파일로 ───────────────────────────────────────────────────
const out = `# 지금 씨드온은 이렇다 (자동 생성 — 손으로 고치지 마세요)

> \`node scripts/team-brief.mjs\`가 만듭니다. 마지막 생성: **${today}**
> 손으로 고치면 다음 실행 때 지워집니다. 배경 설명은 \`docs/team-context.md\`,
> 규칙은 \`CLAUDE.md\`를 보세요.

## 숫자

| | |
|---|---|
| 게시 중인 프로그램 | **${published.count ?? published.rows.length}건** |
| 신청 | ${counts.applications} |
| 도움 요청 | ${counts.help_requests} |
| 북마크 | ${counts.bookmarks} |
| 후기 | ${counts.program_reviews} |
| 커뮤니티 글 | ${counts.community_posts} |

칸별 게시 수 — ${catLine.map(([n, c]) => `${n} ${c}`).join(" · ")}

${thin.length ? `**지금 제일 빈약한 칸: ${thin.join(", ")}.** 리서치는 여기를 우선한다.` : ""}

## 최근 2주에 이미 한 일

**여기 있는 걸 "안 돼 있다"고 보고하지 마세요.** 이미 했거나, 로드가 일부러
그렇게 정한 것입니다. 뭔가 없어 보이면 먼저 이 목록에서 찾아보세요 —
없앤 것도 여기 적힙니다(예: "관심등록 제거"는 로드 지시로 뺀 것이지 버그가
아닙니다).

\`\`\`
${commits || "(최근 2주 커밋 없음)"}
\`\`\`
`;

writeFileSync("docs/team-now.md", out, "utf-8");
console.log(`docs/team-now.md 새로 만들었어요 (${today})`);
console.log(`  게시 ${published.count ?? published.rows.length}건 · ${catLine.map(([n, c]) => `${n}${c}`).join(" ")}`);
if (thin.length) console.log(`  빈약한 칸: ${thin.join(", ")}`);
