#!/usr/bin/env node
/**
 * 화면을 실제로 찍어서 본다.
 *
 * 왜 만들었나 (2026.08.18)
 * 디자인팀에게는 브라우저 도구가 없어서, 여태 코드만 읽고 "이렇게 보일 것"이라고
 * 추정해 보고했다. 카톡 카드 로고가 붙어 보인다는 로드 지적에 네 번 연속으로
 * "떨어져 있다"고 답한 사고가 정확히 그래서 났다 — 원본 크기로만 판단했고
 * 실제 사용자가 보는 크기를 본 적이 없었다.
 * 이제 실장이 이걸 돌려 PNG를 만들어두면, 디자인팀은 Read로 그 그림을 직접 본다.
 *
 * 쓰는 법
 *   node scripts/shot.mjs https://seedon.vercel.app/
 *   node scripts/shot.mjs docs/daily/2026-08-18.html --themes light,dark
 *   node scripts/shot.mjs https://seedon.vercel.app/ /category/housing /apply/edu-01
 *   node scripts/shot.mjs <대상> --widths 390,1000 --out .shots --tall 3000
 *
 * ⚠️ 헤드리스 크롬은 --window-size를 무시하고 제 맘대로 485px로 그린다.
 *    그걸 모르고 390으로 찍으면 넓게 그린 화면을 390으로 "잘라낸" 그림이 나와서,
 *    멀쩡한 화면이 깨져 보인다(2026.08.18에 실제로 여기 속아 오진했다).
 *    그래서 이 도구는 지정한 폭짜리 iframe 안에 넣어서 찍는다. 그게 진짜 폰 폭이다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { resolve, join, basename } from "node:path";

// ── 크롬 찾기 ────────────────────────────────────────────────
function findChrome() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      const p = join(root, dir, "chrome-linux", "chrome");
      if (existsSync(p)) return p;
    }
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (existsSync(p)) return p;
  }
  return null;
}

// ── 옵션 ─────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const outDir = resolve(flag("out", ".shots"));
const widths = flag("widths", "390,1000").split(",").map((n) => parseInt(n.trim(), 10));
const themes = flag("themes", "light").split(",").map((s) => s.trim());
const tall = parseInt(flag("tall", "2600"), 10);
const targets = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));

if (!targets.length) {
  console.log("찍을 대상을 하나 이상 주세요.\n예: node scripts/shot.mjs https://seedon.vercel.app/ --widths 390,1000");
  process.exit(1);
}

const chrome = findChrome();
if (!chrome) {
  console.log("크롬을 못 찾았어요. PLAYWRIGHT_BROWSERS_PATH를 확인하세요.");
  process.exit(1);
}

// 첫 대상이 사이트면 이어지는 경로(/category/housing)는 그 사이트 기준으로 붙인다
let siteBase = null;
const toUrl = (t) => {
  if (/^https?:\/\//.test(t)) {
    try { siteBase = new URL(t).origin; } catch {}
    return t;
  }
  if (t.startsWith("/") && siteBase) return siteBase + t;
  const p = resolve(t);
  if (!existsSync(p)) {
    console.log(`  건너뜀 — 그런 파일이 없어요: ${t}`);
    return null;
  }
  return "file://" + p;
};

const label = (t) => basename(t.replace(/[?#].*$/, "").replace(/\/+$/, "")) || "home";

mkdirSync(outDir, { recursive: true });
const tmp = join(outDir, "_host");
mkdirSync(tmp, { recursive: true });

/* iframe 안에 넣어 찍는다. 같은 출처(로컬 파일)면 안쪽 문서에 손이 닿으므로
   테마를 씌우고 가로 밀림까지 재서 그림 위에 띄운다. 바깥 사이트는 손이
   안 닿으니 그리기만 한다 — 그래도 넘치면 iframe에 가로 스크롤바가 보인다. */
const host = (url, w, theme) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#6b7280;font:12px/1.5 system-ui,sans-serif}
  .bar{width:${w}px;padding:6px 10px;color:#fff;font-weight:700;letter-spacing:.02em}
  .bar b{color:#ffd479}
  iframe{width:${w}px;height:${tall}px;border:0;display:block;background:#fff}
</style></head><body>
<div class="bar" id="bar">${w}px · ${theme}</div>
<iframe id="f" src="${url}"></iframe>
<script>
  var f=document.getElementById('f'), bar=document.getElementById('bar');
  f.addEventListener('load', function(){
    var d;
    try { d = f.contentDocument; } catch (e) { d = null; }
    if(!d){ bar.innerHTML='${w}px · 바깥 사이트 · <b>테마·밀림은 못 재요 (가로 스크롤바가 보이면 밀린 것)</b>'; return; }
    d.documentElement.setAttribute('data-theme','${theme}');
    setTimeout(function(){
      var e=d.documentElement, over=e.scrollWidth-e.clientWidth;
      bar.innerHTML='${w}px · ${theme} · ' + (over>1
        ? '<b>가로로 ' + over + 'px 밀림 — 고쳐야 함</b>'
        : '가로 밀림 없음');
    }, 250);
  });
</script></body></html>`;

console.log(`크롬: ${chrome}`);
console.log(`저장: ${outDir}\n`);

const made = [];
for (const t of targets) {
  const url = toUrl(t);
  if (!url) continue;
  for (const w of widths) {
    for (const theme of themes) {
      const name = `${label(t)}-${w}-${theme}.png`;
      const hostFile = join(tmp, `h-${label(t)}-${w}-${theme}.html`);
      writeFileSync(hostFile, host(url, w, theme), "utf-8");
      try {
        execFileSync(chrome, [
          "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
          // 이게 없으면 크롬이 file:// 끼리도 남남으로 봐서, 안쪽 문서에 테마를
          // 씌우지도 못하고 가로 밀림도 못 잰다 (2026.08.18에 여기서 한 번 헛돌았다)
          "--allow-file-access-from-files",
          `--window-size=${w + 40},${tall + 60}`,
          "--virtual-time-budget=6000",
          `--screenshot=${join(outDir, name)}`,
          "file://" + hostFile,
        ], { stdio: "ignore", timeout: 90_000 });
        made.push(name);
        console.log(`  ✅ ${name}`);
      } catch {
        console.log(`  ❌ ${name} — 못 찍었어요`);
      }
    }
  }
}

rmSync(tmp, { recursive: true, force: true });

console.log(`\n${made.length}장 찍었어요.`);
if (made.length) {
  console.log(`부서에게 이렇게 넘기세요 — "Read 도구로 아래 그림을 직접 보고 판단해라":`);
  for (const m of made) console.log(`  ${join(outDir, m)}`);
  console.log(`\n그림 맨 위 띠에 폭·테마와 "가로 밀림" 여부가 적혀 있어요.`);
}
