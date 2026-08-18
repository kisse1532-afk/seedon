/**
 * 부서가 못 여는 페이지를 실장이 대신 받아서 파일로 넘겨준다.
 *
 * ⚠️ 왜 만들었나 (2026.08.18) — 이게 오늘 제일 큰 발견이다
 *
 * 부서 에이전트는 `WebFetch`만 쓸 수 있는데, 상당수 기관 사이트가 **WebFetch에만**
 * 503을 준다. 같은 주소를 이 컨테이너에서 curl로 열면 200이 나온다. 실측:
 *
 *   gscf.or.kr           WebFetch 503 → curl 200
 *   ibkfoundation.or.kr  WebFetch 503 → curl 200
 *   lottefoundation.or.kr WebFetch 503 → curl 200
 *   shinhanfoundation.or.kr WebFetch 503 → curl 200
 *   samsungwelfare.org   WebFetch 503 → curl 301
 *   nexonfoundation.org  WebFetch 503 → curl 301
 *
 * 즉 **"막혔다"는 부서 보고의 상당수가 사실이 아니었다.** 그동안 멀쩡한 기관을
 * 계속 후보에서 버려왔다. 2026.08.16에 리서치가 4건을 찾고도 숫자를 하나도
 * 확인 못 한 것, 08.18에 11건 중 0건만 게시된 것이 전부 여기서 왔을 수 있다.
 *
 * 그래서 디자인팀에게 화면 사진을 찍어주듯, 리서치팀에게는 **페이지 본문을 받아서
 * 파일로 넘긴다.** 부서에게 `Read` 도구는 있으니 그 파일은 읽을 수 있다.
 *
 * 쓰는 법
 *   node scripts/fetch-pages.mjs https://gscf.or.kr https://ibkfoundation.or.kr
 *   node scripts/fetch-pages.mjs --file urls.txt --out .pages
 *   node scripts/fetch-pages.mjs <주소> --raw     # 태그 안 벗기고 원문 그대로
 *
 * 그다음 부서 프롬프트에 이렇게 적는다:
 *   "아래 파일들을 Read로 열어서 읽어라. WebFetch로 다시 받지 마라 — 막힌다."
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i+1] ? argv[i+1] : d; };
const raw = argv.includes("--raw");
const outDir = resolve(flag("out", ".pages"));

let urls = argv.filter((a, i) => !a.startsWith("--") && !argv[i-1]?.startsWith("--"));
const listFile = flag("file", null);
if (listFile && existsSync(listFile)) {
  urls = urls.concat(readFileSync(listFile, "utf-8").split("\n").map(s => s.trim()).filter(s => s && !s.startsWith("#")));
}
if (!urls.length) {
  console.log("주소를 하나 이상 주세요.\n예: node scripts/fetch-pages.mjs https://gscf.or.kr --out .pages");
  process.exit(1);
}

const slug = (u) => u.replace(/^https?:\/\//, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+$/, "").slice(0, 90);

// HTML → 사람이 읽는 글. 부서가 Read로 열었을 때 바로 읽히게.
function toText(html) {
  let s = html;
  s = s.replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|li|h[1-6]|td|th|section|article)>/gi, "\n");
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, txt) => { const t = txt.replace(/<[^>]+>/g, "").trim(); return t ? `${t} <${href}>` : ` <${href}>`; });
  s = s.replace(/<[^>]+>/g, " ");
  const ent = { "&nbsp;":" ","&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&middot;":"·","&rsquo;":"'","&lsquo;":"'" };
  s = s.replace(/&[a-z#0-9]+;/gi, m => ent[m] ?? m);
  return s.split("\n").map(l => l.replace(/[ \t ]+/g, " ").trim()).filter(Boolean).join("\n");
}

mkdirSync(outDir, { recursive: true });
const made = [], failed = [];

for (const url of urls) {
  const target = /^https?:\/\//.test(url) ? url : "https://" + url;
  let body = "", code = "000";
  try {
    body = execFileSync("curl", [
      "-sS", "-L", "--max-time", "45", "--compressed",
      "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "-H", "Accept-Language: ko-KR,ko;q=0.9",
      "-w", "\n@@HTTP@@%{http_code}", target,
    ], { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024, timeout: 60_000 });
    const m = body.match(/\n@@HTTP@@(\d+)$/);
    if (m) { code = m[1]; body = body.slice(0, m.index); }
  } catch (e) {
    failed.push([target, String(e.message || e).split("\n")[0].slice(0, 70)]);
    console.log(`  ❌ ${target}`);
    continue;
  }
  const text = raw ? body : toText(body);
  if (!body || code.startsWith("4") || code.startsWith("5")) {
    failed.push([target, `HTTP ${code}`]);
    console.log(`  ⚠️  ${target} — HTTP ${code}`);
    continue;
  }
  const name = `${slug(target)}.txt`;
  writeFileSync(join(outDir, name), `# ${target}\n# HTTP ${code} · ${text.length}자\n\n${text}`, "utf-8");
  made.push([name, code, text.length]);
  console.log(`  ✅ ${name}  (HTTP ${code}, ${text.length}자)`);
}

console.log(`\n받은 것 ${made.length} · 못 받은 것 ${failed.length}`);
if (made.length) {
  console.log(`\n부서 프롬프트에 이렇게 적으세요:\n`);
  console.log(`  아래 파일을 Read로 열어서 읽어라. WebFetch로 다시 받지 마라 — 막힌다.`);
  for (const [n] of made) console.log(`  ${join(outDir, n)}`);
}
if (failed.length) {
  console.log(`\n못 받은 것 — 이건 진짜 막힌 것이다:`);
  for (const [u, why] of failed) console.log(`  ${u} — ${why}`);
}
