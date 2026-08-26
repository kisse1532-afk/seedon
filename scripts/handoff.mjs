#!/usr/bin/env node
/**
 * 인계함 — 팀 사이에 넘어가는 일을 기계가 나른다.
 *
 * 왜 만들었나 (2026.08.25)
 * -----------------------
 * 8일치 기록을 재보니 팀 사이에 넘어간 일이 4건인데 **4건 전부 실장이 손으로
 * 옮겼고, 팀끼리 직접 넘어간 건 0건**이었다. 팀은 서로를 볼 수 없다 —
 * 같은 방에 있지 않고 각자 실장에게만 말한다. 그래서 운영이 낮에 찾은 것을
 * 조사가 받는 데 하루가 걸렸다(실장이 밤에 옮겨 적어야 해서).
 *
 * 로드(2026.08.25): "팀별로 디벨롭 포인트 잡고 개선해줄 점 찾아서
 * 개선할 수 있으면 개선까지 해보자."
 *
 * 어떻게 도나
 * ----------
 * ① 팀 보고서의 "넘기는 것"을 그날 안에 여기 넣는다:
 *      node scripts/handoff.mjs add 운영 조사 "worldvision 카드 링크가 503 — 재확인 필요"
 * ② 다음 날 팀을 부르기 전에 그 팀 앞으로 온 것을 뽑아 프롬프트에 붙인다:
 *      node scripts/handoff.mjs 조사
 * ③ 처리되면 닫는다:
 *      node scripts/handoff.mjs done 3
 *
 * 저장은 `docs/인계함.md` 한 파일이다. 사람이 읽을 수 있고 git에 기록이 남는다.
 * 사흘 넘게 열려 있는 인계는 뽑을 때 ⚠️로 표시된다 — 쌓이는 걸 숨기지 않는다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "docs/인계함.md";
const TEAMS = ["조사", "제작", "운영", "검토", "실장", "로드"];

const HEADER = `# 인계함 — 팀 사이에 넘어가는 일

> **손으로 고치지 말고 \`scripts/handoff.mjs\`로 넣고 닫으세요.** 형식이 깨지면 기계가 못 읽습니다.
> 넣기: \`node scripts/handoff.mjs add <보낸팀> <받는팀> "<내용>"\`
> 뽑기: \`node scripts/handoff.mjs <팀>\` · 닫기: \`node scripts/handoff.mjs done <번호>\`

| 번호 | 날짜 | 보낸 팀 | 받는 팀 | 내용 | 상태 |
|---|---|---|---|---|---|
`;

function load() {
  if (!existsSync(FILE)) return [];
  const rows = [];
  for (const line of readFileSync(FILE, "utf-8").split("\n")) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([\d-]+)\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(.+?)\s*\|\s*(열림|완료)\s*\|$/);
    if (m) rows.push({ no: +m[1], date: m[2], from: m[3], to: m[4], what: m[5], open: m[6] === "열림" });
  }
  return rows;
}

function save(rows) {
  const body = rows
    .map((r) => `| ${r.no} | ${r.date} | ${r.from} | ${r.to} | ${r.what} | ${r.open ? "열림" : "완료"} |`)
    .join("\n");
  writeFileSync(FILE, HEADER + body + "\n");
}

const [cmd, ...rest] = process.argv.slice(2);
const rows = load();

if (cmd === "add") {
  const [from, to, ...what] = rest;
  if (!TEAMS.includes(from) || !TEAMS.includes(to) || !what.length) {
    console.log(`쓰는 법: node scripts/handoff.mjs add <보낸팀> <받는팀> "<내용>"
팀 이름: ${TEAMS.join(" / ")}`);
    process.exit(1);
  }
  const no = rows.length ? Math.max(...rows.map((r) => r.no)) + 1 : 1;
  rows.push({ no, date: new Date().toISOString().slice(0, 10), from, to,
              what: what.join(" ").replace(/\|/g, "·"), open: true });
  save(rows);
  console.log(`✅ #${no} ${from} → ${to}: ${what.join(" ")}`);
} else if (cmd === "done") {
  const no = +rest[0];
  const r = rows.find((x) => x.no === no);
  if (!r) { console.log(`#${no}이 없어요.`); process.exit(1); }
  r.open = false;
  save(rows);
  console.log(`✅ #${no} 닫음 — ${r.from} → ${r.to}: ${r.what}`);
} else if (TEAMS.includes(cmd)) {
  const mine = rows.filter((r) => r.open && r.to === cmd);
  if (!mine.length) {
    console.log(`${cmd} 앞으로 온 열린 인계가 없어요. 프롬프트에는 "받은 인계: 없음"으로 적으면 됩니다.`);
    process.exit(0);
  }
  console.log(`────── 아래를 ${cmd} 프롬프트에 그대로 붙이세요 ──────\n`);
  console.log(`## 받은 인계 — 처리하고 보고서의 "받은 인계 처리"에 결과를 적으세요\n`);
  const today = Date.now();
  for (const r of mine) {
    const days = Math.floor((today - Date.parse(r.date)) / 864e5);
    const late = days >= 3 ? ` ⚠️ ${days}일째 열려 있음` : "";
    console.log(`- **[#${r.no}] ${r.from}이 넘김 (${r.date})${late}** — ${r.what}`);
  }
} else if (cmd === "list" || !cmd) {
  const open = rows.filter((r) => r.open);
  console.log(`열린 인계 ${open.length}건 / 전체 ${rows.length}건`);
  for (const r of open) console.log(`  #${r.no} ${r.date} ${r.from}→${r.to}: ${r.what}`);
} else {
  console.log(`쓰는 법:
  node scripts/handoff.mjs <팀>                       그 팀 앞 열린 인계를 프롬프트용으로 출력
  node scripts/handoff.mjs add <보낸팀> <받는팀> "<내용>"
  node scripts/handoff.mjs done <번호>
  node scripts/handoff.mjs list
팀 이름: ${TEAMS.join(" / ")}`);
}
