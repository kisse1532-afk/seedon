#!/usr/bin/env node
/**
 * 공공데이터포털(data.go.kr)에서 기관 명단을 받아 `docs/데이터/`에 넣는다.
 *
 * 왜 만들었나 (2026.08.25)
 * -----------------------
 * 여성가족부(성평등가족부) 게시판의 첨부 파일이 우리 쪽에서는 계속 다운로드가
 * 거부됐다. 그래서 2026.08.18부터 로드에게 "폰으로 받아서 주세요"를
 * 일주일 내내 부탁하고 있었다.
 *
 * 조사 관점이 오늘 다른 길을 찾았다 — **같은 데이터가 공공데이터포털에는
 * 로그인 없이 CSV로 올라와 있다.** 실제로 받아보니 그대로 받아졌다.
 * 로드의 할 일 하나가 없어졌다.
 *
 * 왜 저장소에 넣나
 * 부서(조사·검토)에게는 파일을 읽는 도구만 있고 내려받는 도구가 없다.
 * 받아서 넣어둬야 부서가 쓴다. 공개 데이터라 저장소에 둬도 된다.
 *
 * ⚠️ 이 명단은 **개별 시설**이다. `docs/기관명부.md`에는 시도 대표 기관만
 *    넣는 규칙이므로 여기 있는 240곳을 명부에 그대로 밀어넣지 않는다.
 *    카드에 "가까운 곳 전화번호"를 붙일 때 근거로 쓴다.
 *
 * 쓰는 법
 *   node scripts/fetch-opendata.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// 프록시를 안 켜면 바깥에 못 나간다. 깜빡해도 되게 스스로 다시 실행한다.
if (!process.env.NODE_USE_ENV_PROXY) {
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  process.exit(0);
}

/* 파일 번호(atchFileId)는 자료가 갱신되면 바뀐다. 그래서 번호를 박아두지 않고
   소개 페이지에서 매번 새로 읽는다. */
const TARGETS = [
  {
    page: "https://www.data.go.kr/data/3084537/fileData.do",
    out: "청소년상담복지센터.csv",
    what: "청소년상담복지센터 명단 (전화번호·홈페이지 포함)",
  },
  {
    page: "https://www.data.go.kr/data/15100267/fileData.do",
    out: "청소년자립지원관.csv",
    what: "청소년자립지원관 명단 (주소·대표전화 포함)",
  },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const dir = "docs/데이터";
mkdirSync(dir, { recursive: true });

let ok = 0;
for (const t of TARGETS) {
  try {
    const html = await (await fetch(t.page, { headers: { "user-agent": UA } })).text();
    const m = html.match(/atchFileId=(FILE_\d+)/) || html.match(/atchFileId:\s*'?(FILE_\d+)/);
    if (!m) {
      console.log(`  ✕ ${t.out} — 내려받기 주소를 못 찾았어요`);
      continue;
    }

    const url = `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=1`;
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    const buf = Buffer.from(await res.arrayBuffer());

    // 공공기관 CSV는 대개 EUC-KR이다. 깨지면 UTF-8로 다시 읽는다
    let txt = new TextDecoder("euc-kr").decode(buf);
    if ((txt.match(/�/g) || []).length > 20) txt = new TextDecoder("utf-8").decode(buf);

    const rows = txt.trim().split(/\r?\n/).length - 1;
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(`${dir}/${t.out}`, `# 출처: ${t.page}\n# 받은 날: ${today}\n${txt}`);
    console.log(`  ✅ ${t.out} — ${rows}곳 · ${t.what}`);
    ok++;
  } catch (e) {
    console.log(`  ✕ ${t.out} — ${e.message}`);
  }
}

console.log(`\n${ok}개 받았어요 → ${dir}/`);
console.log(`부서에게는 "Read로 이 파일을 열어라"라고 넘기세요. 부서에는 내려받는 도구가 없습니다.`);
