/**
 * 공고 첨부 한글파일(.hwpx)에서 글자를 뽑는 공통 코드.
 *
 * read-hwpx.mjs(사람이 읽으려고 열 때)와 verify-facts.mjs(금액 근거를 대조할 때)
 * 두 곳에서 쓴다. 한쪽만 고치면 "도구로는 보이는데 대조에서는 근거 없다고
 * 뜨는" 엇갈림이 생기므로 여기 모아둔다.
 *
 * .hwpx는 속이 ZIP이고 Contents/section*.xml 안에 글자가 들어 있다.
 * 구형 .hwp(바이너리)는 구조가 달라서 못 읽는다.
 */

import { spawnSync } from "node:child_process";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** 앞 두 글자가 PK면 ZIP(=hwpx일 수 있음)이다. */
export const looksLikeZip = (buf) =>
  buf && buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;

/** hwpx 파일에서 본문 글자만 뽑는다. 실패하면 null. */
export function extractHwpxText(file) {
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

/** 공고 페이지 HTML에서 첨부파일 내려받기 주소를 긁는다. */
export function findAttachmentUrls(html, pageUrl) {
  const base = new URL(pageUrl);
  const urls = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/gi)) {
    const href = m[1];
    if (!/down|file|atch|attach/i.test(href)) continue;
    try {
      urls.add(new URL(href.replace(/&amp;/g, "&"), base).href);
    } catch {
      /* 자바스크립트 호출 등 주소가 아닌 것은 건너뛴다 */
    }
  }
  return [...urls];
}

async function getBuffer(url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: ac.signal,
      headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
    });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 공고 페이지에 붙어 있는 hwpx를 찾아 읽는다. 없으면 null.
 *
 * 공공기관이 내용을 첨부에만 넣는 일이 흔해서, 웹페이지 본문만 보고
 * "근거 없는 금액"이라고 판정하면 오판이 된다. 실제로 서울시 그룹활동
 * 지원사업의 "동아리 1개당 1,250,000원"을 그렇게 잘못 지운 적이 있다.
 */
// 첨부 내려받기는 페이지 열기보다 느리다. 공공기관 서버가 수십~수백 KB 파일을
// 굼뜨게 내주는 일이 흔해서, 페이지와 같은 30초로 잡으면 멀쩡한 첨부를 놓친다.
export async function readNoticeAttachment(pageUrl, { timeoutMs = 90_000, maxTries = 10, html = null } = {}) {
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = mkdtempSync(join(tmpdir(), "hwpx-"));
  const save = (buf) => {
    const f = join(dir, "a.hwpx");
    writeFileSync(f, buf);
    return f;
  };

  // 호출한 쪽이 이미 받아둔 HTML이 있으면 그걸 쓴다. 같은 페이지를 두 번
  // 받으면 그만큼 실패할 기회도 늘어난다 — gg.go.kr처럼 간헐적으로 502를
  // 내는 사이트에서 실제로 첫 요청만 성공하고 두 번째가 실패했다.
  let pageHtml = html;
  if (pageHtml === null) {
    const head = await getBuffer(pageUrl, timeoutMs);
    if (!head) return null;
    // 주소가 곧바로 파일인 경우
    if (looksLikeZip(head)) {
      const text = extractHwpxText(save(head));
      return text ? { text, url: pageUrl } : null;
    }
    pageHtml = head.toString("utf8");
  }

  const cands = findAttachmentUrls(pageHtml, pageUrl);
  for (const u of cands.slice(0, maxTries)) {
    const buf = await getBuffer(u, timeoutMs);
    if (!looksLikeZip(buf)) continue;
    const text = extractHwpxText(save(buf));
    if (text) return { text, url: u };
  }
  return null;
}
