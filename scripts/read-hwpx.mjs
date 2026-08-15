/**
 * 공공기관 공고의 한글파일(.hwpx)을 열어 본문을 읽는다.
 *
 * 왜 필요한가: 2026-08-15 발굴에서 반복해서 막힌 지점이다. 공공기관이 공고
 * 웹페이지에는 제목만 올리고 정작 내용(금액·마감일·신청방법·자격)은 첨부
 * 한글파일에만 넣는다. 서울시 청소년 그룹활동 지원사업도, 경기도 청소년
 * 생활장학금도 똑같았다. 그래서 CLAUDE.md 규칙("숫자는 공식 페이지에서 직접
 * 본 것만")을 지키려면 금액을 통째로 빼고 올릴 수밖에 없었다.
 *
 * 첨부파일을 읽을 수 있으면 그 숫자가 "공식 페이지에서 직접 본 것"이 된다.
 * 검색 결과나 언론 보도를 베끼지 않고도 카드를 채울 수 있다.
 *
 * 쓰는 법:
 *   node scripts/read-hwpx.mjs <공고 페이지 URL>   # 첨부를 찾아서 읽어준다
 *   node scripts/read-hwpx.mjs <hwpx 파일 경로>
 *   node scripts/read-hwpx.mjs <URL> --full        # 본문 전체 출력
 *
 * .hwpx는 속이 ZIP이고 Contents/section*.xml 안에 글자가 들어 있다.
 * 구형 .hwp(바이너리)는 구조가 완전히 달라서 이 도구로 못 읽는다 — 그 경우는
 * 규칙대로 숫자를 빼고 올리고 review_note에 남길 것.
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const full = args.includes("--full");
const target = args.find((a) => !a.startsWith("-"));

if (!target) {
  console.error("쓰는 법: node scripts/read-hwpx.mjs <공고 URL 또는 hwpx 경로> [--full]");
  process.exit(1);
}

async function get(url, asBuffer = false) {
  const r = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return asBuffer ? Buffer.from(await r.arrayBuffer()) : r.text();
}

/** 공고 페이지에서 첨부파일 내려받기 주소를 긁는다. */
function findAttachments(html, pageUrl) {
  const base = new URL(pageUrl);
  const urls = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/gi)) {
    const href = m[1];
    if (!/down|file|atch|attach/i.test(href)) continue;
    try {
      urls.add(new URL(href.replace(/&amp;/g, "&"), base).href);
    } catch {
      /* 상대 주소가 아닌 자바스크립트 호출 등은 건너뛴다 */
    }
  }
  return [...urls];
}

/** hwpx(=ZIP) 속 Contents/section*.xml 에서 글자만 뽑는다. */
function extract(file) {
  const list = spawnSync("unzip", ["-Z1", file], { encoding: "utf8" });
  if (list.status !== 0) return null;
  const sections = list.stdout
    .split("\n")
    .filter((n) => /^Contents\/section\d+\.xml$/.test(n))
    .sort();
  if (sections.length === 0) return null;

  let out = "";
  for (const s of sections) {
    const r = spawnSync("unzip", ["-p", file, s], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) continue;
    // 문단이 끝나면 줄을 바꾸고, <hp:t> 안의 글자만 모은다.
    const xml = r.stdout.replace(/<\/hp:p>/g, "\n");
    for (const m of xml.matchAll(/<hp:t[^>]*>([\s\S]*?)<\/hp:t>/g)) {
      out += m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    }
    out += "\n";
  }
  return out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * 카드를 채울 때 실제로 필요한 항목만 먼저 보여준다.
 * 공고문이 수천 자라 전문을 다 읽으면 정작 숫자를 놓친다.
 */
function highlights(text) {
  const KEYS = [
    ["지원금액·규모", /지원\s*금액|지원금액|장학금액|지원\s*내용|지원규모|상금/],
    ["신청기간·마감", /신청\s*기간|접수\s*기간|모집\s*기간|신청기한|제출\s*기한/],
    ["신청방법", /신청\s*방법|접수\s*방법|제출\s*방법/],
    ["대상·자격", /지원\s*대상|신청\s*자격|모집\s*대상|참가\s*자격/],
    ["문의처", /문의|담당자|연락처/],
    ["유의사항", /유의\s*사항|주의\s*사항|중복/],
  ];
  const lines = [];
  for (const [label, re] of KEYS) {
    const m = re.exec(text);
    if (!m) continue;
    lines.push([label, text.slice(m.index, m.index + 320).replace(/\n/g, " ").trim()]);
  }
  return lines;
}

let file = target;
let sourceNote = "";

if (/^https?:\/\//.test(target)) {
  const dir = mkdtempSync(join(tmpdir(), "hwpx-"));
  const head = await get(target, true).catch(() => null);

  // 주소가 곧바로 파일인 경우와, 공고 페이지인 경우를 모두 받는다.
  const isZip = head && head.length > 4 && head[0] === 0x50 && head[1] === 0x4b;
  if (isZip) {
    file = join(dir, "a.hwpx");
    writeFileSync(file, head);
    sourceNote = target;
  } else {
    const html = head ? head.toString("utf8") : await get(target);
    const cands = findAttachments(html, target);
    if (cands.length === 0) {
      console.error("이 페이지에서 첨부파일 링크를 못 찾았어요.");
      console.error("파일 주소를 직접 넣어보거나, 페이지에 첨부가 없는지 확인하세요.");
      process.exit(1);
    }
    let picked = null;
    for (const u of cands) {
      const buf = await get(u, true).catch(() => null);
      if (buf && buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b) {
        picked = join(dir, "a.hwpx");
        writeFileSync(picked, buf);
        sourceNote = u;
        break;
      }
    }
    if (!picked) {
      console.error(`첨부 ${cands.length}건을 받아봤지만 hwpx가 없었어요.`);
      console.error("구형 .hwp(바이너리)이면 이 도구로는 못 읽어요 — 숫자를 빼고 올리고 review_note에 남기세요.");
      process.exit(1);
    }
    file = picked;
  }
} else if (!existsSync(file)) {
  console.error("그런 파일이 없어요:", file);
  process.exit(1);
}

const text = extract(file);
if (!text) {
  console.error("hwpx 구조가 아니에요. 구형 .hwp이면 이 도구로는 못 읽어요.");
  process.exit(1);
}

if (sourceNote) console.log(`첨부: ${sourceNote}`);
console.log(`본문 ${text.length}자를 읽었어요.\n`);

const hi = highlights(text);
if (hi.length) {
  console.log("## 카드에 필요한 부분");
  for (const [label, snippet] of hi) console.log(`\n### ${label}\n${snippet}`);
  console.log("\n※ 여기 보이는 숫자는 공고문 원문이라 카드에 써도 됩니다. 앞뒤 문맥은 --full 로 확인하세요.");
}

if (full || hi.length === 0) {
  console.log("\n## 본문 전체\n");
  console.log(text);
}
