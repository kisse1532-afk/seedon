/**
 * 기관 표(DB)를 읽어 `docs/기관명부.md`의 목록 부분을 다시 만든다.
 * 그리고 **이번 주에 볼 곳**을 골라준다.
 *
 * 왜 만들었나 (2026.08.18 로드 지시)
 * 로드: "삼성재단이다 하면 삼성재단에 계속적으로 프로그램을 올리는 곳(링크)를
 * 찾아놓으면 될 거 아니야. (…) 우리 db에 심어놓고, 그거를 일주일에 어떻게
 * 프로그램들을 찾아서 올릴지 고민하고 그러라고."
 *
 * 명부를 손으로 쓰는 마크다운으로만 두면 "이번 주에 어디를 볼지"를 사람이 매번
 * 눈으로 골라야 한다. 표에 두면 기계가 고른다 — 마지막으로 본 지 오래된 곳부터.
 * 부서는 DB 도구가 없으므로 이 스크립트가 마크다운으로 옮겨준다.
 *
 * 쓰는 법:  node scripts/org-sync.mjs
 * 필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   (읽기 권한으로 안 되면 SUPABASE_SERVICE_ROLE_KEY)
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

import { readFileSync, writeFileSync } from "node:fs";

const envLib = await import("./lib/env.mjs");
const { url, key: readKey } = envLib.requireSupabase();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || readKey;

const r = await fetch(`${url}/rest/v1/orgs?select=*&order=region,name`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!r.ok) {
  console.log(`기관 표를 못 읽었어요 (${r.status}). 이 표는 내부용이라 공개 읽기가 막혀 있어요.`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY를 넣고 다시 돌리세요.`);
  process.exit(1);
}
const orgs = await r.json();

const TYPE = { foundation:"재단", corporate:"기업재단", public:"공공", nonprofit:"비영리",
               socialventure:"소셜벤처", assoc:"협회", local:"지역거점", university:"대학" };
const CAT  = { education:"교육", counseling:"심리상담", housing:"주거", living:"경제·생활비",
               career:"진로·취업", culture:"문화체험", contest:"공모전·대회" };
const REACH= { open:"열림", blocked:"막힘", login:"로그인 필요", unknown:"미확인" };

const today = new Date().toISOString().slice(0,10);
const daysAgo = (d) => d ? Math.round((Date.parse(today) - Date.parse(d)) / 86400000) : null;

// ── 이번 주에 볼 곳 ──────────────────────────────────────────
const DUE = { weekly: 7, monthly: 30, yearly: 365 };
const due = orgs
  .filter(o => o.harvest_cycle !== "paused" && o.notice_url)
  .map(o => ({ ...o, age: daysAgo(o.last_checked) }))
  .filter(o => o.age === null || o.age >= (DUE[o.harvest_cycle] ?? 30))
  .sort((a,b) => (b.age ?? 9999) - (a.age ?? 9999));

// ── 손봐야 할 것 ─────────────────────────────────────────────
const noNotice = orgs.filter(o => !o.notice_url && o.harvest_cycle !== "paused");
const dead     = orgs.filter(o => o.last_post_at && daysAgo(o.last_post_at) > 730);
const barren   = orgs.filter(o => o.notice_url && (o.programs_found ?? 0) === 0
                                  && o.last_checked && daysAgo(o.last_checked) > 60
                                  && o.harvest_cycle !== "paused");

const line = (o) => `| ${o.name} | ${TYPE[o.org_type] ?? o.org_type} | ${o.region ?? "—"} | ${
  o.notice_url ? `[공고](${o.notice_url})` : "**없음**"} | ${REACH[o.reachable] ?? "미확인"} | ${
  o.last_post_at ?? "—"} | ${o.programs_found ?? 0} | ${o.last_checked ?? "—"} |`;

const HEAD = `| 기관 | 종류 | 지역 | 공고 링크 | 여나 | 최신 글 | 카드 | 마지막 확인 |\n|---|---|---|---|---|---|---|---|`;

let out = `\n<!-- 여기부터는 scripts/org-sync.mjs가 만듭니다. 손으로 고치지 마세요 (${today}) -->\n\n`;

out += `## 📌 이번 주에 볼 곳 (${due.length}곳)\n\n`;
out += `**여기부터 하면 된다.** 마지막으로 본 지 오래된 곳 순서다.\n`;
out += `주기가 \`weekly\`면 7일, \`monthly\`면 30일이 지나면 다시 뜬다.\n\n`;
out += due.length ? HEAD + "\n" + due.map(line).join("\n") + "\n" : "지금은 다 봤어요. 새 기관을 찾을 때예요.\n";

if (noNotice.length) {
  out += `\n## ⚠️ 공고 링크를 아직 못 찾은 곳 (${noNotice.length}곳)\n\n`;
  out += `**대문 주소만 있고 프로그램이 올라오는 페이지를 모른다.** 이걸 찾는 게 리서치의 일이다 —\n`;
  out += `공고 링크가 없으면 그 기관은 명부에 있어도 아무 카드도 못 만든다.\n\n`;
  out += HEAD + "\n" + noNotice.map(line).join("\n") + "\n";
}
if (dead.length) {
  out += `\n## 💀 게시판이 멈춘 곳 (${dead.length}곳)\n\n`;
  out += `최신 글이 2년 넘게 없다. **사업이 살아 있는지부터 확인해야 한다.**\n\n`;
  out += HEAD + "\n" + dead.map(line).join("\n") + "\n";
}
if (barren.length) {
  out += `\n## 🌵 두 달 넘게 카드가 안 나온 곳 (${barren.length}곳)\n\n`;
  out += `공고 링크는 있는데 여기서 나온 카드가 0건이다. 주기를 늦추거나 내릴 후보다.\n\n`;
  out += HEAD + "\n" + barren.map(line).join("\n") + "\n";
}

// 지역·칸별 전체 목록
const byRegion = {};
for (const o of orgs) (byRegion[o.region ?? "지역 미상"] ??= []).push(o);
out += `\n## 전체 목록 (${orgs.length}곳)\n`;
for (const region of Object.keys(byRegion).sort((a,b) => a === "전국" ? -1 : b === "전국" ? 1 : a.localeCompare(b))) {
  out += `\n### ${region} (${byRegion[region].length}곳)\n\n` + HEAD + "\n"
       + byRegion[region].map(line).join("\n") + "\n";
}

// 칸별 몇 곳인지
const catCount = {};
for (const o of orgs) for (const c of (o.categories ?? [])) catCount[c] = (catCount[c] ?? 0) + 1;
out += `\n### 칸별 기관 수\n\n`;
out += Object.entries(CAT).map(([k,v]) => `${v} ${catCount[k] ?? 0}`).join(" · ") + "\n";

const MARK_S = "<!-- AUTO:START -->", MARK_E = "<!-- AUTO:END -->";
const p = "docs/기관명부.md";
let doc = readFileSync(p, "utf-8");
const body = `${MARK_S}\n${out}\n${MARK_E}`;
doc = doc.includes(MARK_S)
  ? doc.replace(new RegExp(`${MARK_S}[\\s\\S]*?${MARK_E}`), body)
  : doc.trimEnd() + "\n\n" + body + "\n";
writeFileSync(p, doc, "utf-8");

console.log(`docs/기관명부.md 갱신 (${today})`);
console.log(`  전체 ${orgs.length}곳 · 공고 링크 ${orgs.filter(o=>o.notice_url).length}곳`);
console.log(`  📌 이번 주에 볼 곳 ${due.length}`);
if (noNotice.length) console.log(`  ⚠️ 공고 링크 없음 ${noNotice.length} — 리서치가 찾을 것`);
if (dead.length)     console.log(`  💀 멈춘 게시판 ${dead.length}`);
if (barren.length)   console.log(`  🌵 카드 0건 ${barren.length}`);
