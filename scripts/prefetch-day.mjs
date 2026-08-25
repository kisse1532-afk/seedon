#!/usr/bin/env node
/**
 * 관점을 부르기 **전에** 오늘 볼 페이지를 전부 미리 받아둔다.
 *
 * 왜 만들었나 (2026.08.25)
 * -----------------------
 * 관점이 쓰는 도구로는 기관 사이트가 안 열리는데, 실장이 다른 방법으로 열면 열린다.
 * **8일째 매일 반복됐다** — 08.18 여섯 곳, 08.19 열세 곳 중 아홉, 08.20 여덟 중 일곱,
 * 08.25 다섯 중 넷. 관점 잘못이 아니라 도구 차이다.
 *
 * 그동안 대응은 "관점이 막혔다고 하면 실장이 다시 확인한다"였다. 규칙은 이미
 * `.claude/agents/research.md` 79~84행에 적혀 있었고 관점도 그대로 따랐다.
 * 그런데도 매일 같은 오보가 났다 — **규칙이 부족한 게 아니라 순서가 틀렸다.**
 * 관점이 막힌 걸 겪고 → 보고하고 → 실장이 다시 받고 → 다음 날 넘기는 왕복이
 * 하루씩 걸렸고, 그 왕복이 전부 실장을 지나가서 병목을 키웠다.
 *
 * 그래서 순서를 뒤집는다. **부르기 전에 다 받아두고 경로를 같이 준다.**
 * 관점은 처음부터 `.pages/…txt`를 Read로 열면 된다. 막힐 일이 없다.
 *
 * 쓰는 법
 *   node scripts/prefetch-day.mjs              # 오늘 볼 곳 전부
 *   node scripts/prefetch-day.mjs --limit 8    # 앞에서 8곳만
 *
 * 결과: `.pages/`에 파일이 쌓이고, **관점 프롬프트에 붙일 목록**을 찍어준다.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (!process.env.NODE_USE_ENV_PROXY) {
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  process.exit(0);
}

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const limit = parseInt(flag("limit", "12"), 10);

/* 어디서 주소를 모으나
   ① 기관 명부의 "이번 주에 볼 곳" — 기계가 이미 골라둔 것
   ② 명부에서 아직 공고 링크를 못 찾은 곳의 대문
   둘 다 `docs/기관명부.md`에 있다. 명부는 org-sync.mjs가 만드니 늘 최신이다. */
function urlsFromDirectory() {
  const p = "docs/기관명부.md";
  if (!existsSync(p)) return [];
  const doc = readFileSync(p, "utf-8");
  const out = [];
  const want = [
    { head: "## 📌 이번 주에 볼 곳", why: "이번 주에 볼 곳" },
    { head: "## ⚠️ 공고 링크를 아직 못 찾은 곳", why: "공고 링크 찾아야 함" },
  ];
  for (const { head, why } of want) {
    const i = doc.indexOf(head);
    if (i < 0) continue;
    const block = doc.slice(i, doc.indexOf("\n## ", i + 1) >>> 0 || undefined);
    for (const line of block.split("\n")) {
      if (!line.startsWith("|")) continue;
      const name = line.split("|")[1]?.trim();
      const m = line.match(/\((https?:\/\/[^)\s]+)\)/);
      if (name && m) out.push({ url: m[1], name, why });
    }
  }
  return out;
}

const seen = new Set();
const targets = urlsFromDirectory()
  .filter((t) => (seen.has(t.url) ? false : seen.add(t.url)))
  .slice(0, limit);

if (!targets.length) {
  console.log("받을 주소를 못 찾았어요. `node scripts/org-sync.mjs`를 먼저 돌려보세요.");
  process.exit(0);
}

console.log(`오늘 미리 받을 곳 ${targets.length}곳\n`);

const ok = [];
const failed = [];
for (const t of targets) {
  try {
    execFileSync(process.execPath, ["scripts/fetch-pages.mjs", t.url], {
      stdio: "pipe",
      env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
    });
    // fetch-pages가 만드는 파일 이름 규칙을 그대로 따른다
    const file = ".pages/" + t.url.replace(/^https?:\/\//, "").replace(/[/?=&#]+/g, "_").replace(/_+$/, "") + ".txt";
    const found = existsSync(file) ? file : null;
    if (found) {
      const head = readFileSync(found, "utf-8").split("\n")[1] || "";
      console.log(`  ✅ ${t.name} — ${head.replace(/^#\s*/, "")}`);
      ok.push({ ...t, file: found });
    } else {
      console.log(`  ⚠️ ${t.name} — 받긴 했는데 파일을 못 찾겠어요`);
      failed.push(t);
    }
  } catch {
    console.log(`  ✕ ${t.name} — 못 받았어요 (${t.url})`);
    failed.push(t);
  }
}

console.log(`\n받은 것 ${ok.length} · 못 받은 것 ${failed.length}`);
console.log(`\n────── 아래를 관점 프롬프트에 그대로 붙이세요 ──────\n`);
console.log(`**오늘 볼 곳은 제가 미리 받아뒀습니다. WebFetch로 다시 받지 마세요 — 막힙니다.**`);
console.log(`**아래 파일을 Read로 열면 됩니다.**\n`);
for (const t of ok) console.log(`- ${t.name} (${t.why})\n  \`${t.file}\`\n  원래 주소: ${t.url}`);
if (failed.length) {
  console.log(`\n**아래는 저도 못 받았습니다. "확인 못 함"으로 두세요 — 당신 잘못이 아닙니다.**`);
  for (const t of failed) console.log(`- ${t.name} — ${t.url}`);
}
